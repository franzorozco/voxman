<?php

namespace App\Support;

use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

/**
 * Subida segura de archivos.
 *
 * - La extensión y el tipo se determinan por el CONTENIDO real del archivo
 *   (finfo), nunca por el nombre/extensión/MIME que envía el cliente.
 * - Solo se permiten formatos de una lista blanca (sin SVG/HTML/PHP).
 * - Se limita el tamaño.
 * - El nombre final lo genera el servidor (UUID + extensión validada).
 */
class SecureUpload
{
    /** mime real => extensión */
    private const IMAGES = [
        'image/jpeg' => 'jpg',
        'image/png'  => 'png',
        'image/webp' => 'webp',
        'image/gif'  => 'gif',
        'image/vnd.microsoft.icon' => 'ico', // favicons
        'image/x-icon'             => 'ico',
    ];

    private const VIDEOS = [
        'video/mp4'       => 'mp4',
        'video/quicktime' => 'mov',
        'video/webm'      => 'webm',
    ];

    public const MAX_IMAGE_KB = 10240;  // 10 MB
    public const MAX_VIDEO_KB = 51200;  // 50 MB

    /** Valida y devuelve la extensión segura. Lanza ValidationException si no es válido. */
    public static function validate($file, string $kind = 'image', string $field = 'file'): string
    {
        $allowed = $kind === 'video' ? self::VIDEOS : self::IMAGES;
        $maxKb   = $kind === 'video' ? self::MAX_VIDEO_KB : self::MAX_IMAGE_KB;
        $label   = $kind === 'video' ? 'un video (mp4, mov, webm)' : 'una imagen (jpg, png, webp, gif)';

        if (!$file instanceof UploadedFile || !$file->isValid()) {
            throw ValidationException::withMessages([$field => 'Archivo inválido o corrupto.']);
        }

        if ($file->getSize() === false || $file->getSize() > $maxKb * 1024) {
            throw ValidationException::withMessages([$field => "El archivo supera el máximo de " . ($maxKb / 1024) . " MB."]);
        }

        // MIME detectado por contenido (finfo), no el que declara el cliente
        $real = $file->getRealPath();
        if (!$real || !is_readable($real)) {
            throw ValidationException::withMessages([$field => 'Archivo inválido o ilegible.']);
        }

        $finfo = new \finfo(FILEINFO_MIME_TYPE);
        $mime  = @$finfo->file($real);

        if (!isset($allowed[$mime])) {
            throw ValidationException::withMessages([$field => "Solo se permite {$label}."]);
        }

        // Una imagen debe ser decodificable como imagen real
        if ($kind === 'image') {
            if (@getimagesize($real) === false) {
                throw ValidationException::withMessages([$field => 'La imagen está dañada o no es válida.']);
            }
            // Defensa anti-polyglot: sin código PHP/script incrustado
            $raw = file_get_contents($real);
            if ($raw === false || preg_match('/<\?(php|=)|<script|<html|<svg/i', $raw)) {
                throw ValidationException::withMessages([$field => 'La imagen contiene contenido no permitido.']);
            }
        }


        return $allowed[$mime];
    }

    /** Valida TODOS los archivos de la petición (incluye arrays anidados). */
    public static function validateAll(Request $request, string $kind = 'image'): void
    {
        $walk = function ($item, string $path) use (&$walk, $kind) {
            if (is_array($item)) {
                foreach ($item as $k => $v) {
                    $walk($v, $path . '.' . $k);
                }
                return;
            }
            self::validate($item, $kind, $path);
        };

        foreach ($request->allFiles() as $key => $value) {
            $walk($value, (string) $key);
        }
    }

    /** Valida y guarda el archivo en $dir del disco $disk. Devuelve la ruta relativa. */
    public static function store($file, string $dir, string $kind = 'image', string $disk = 's3', string $field = 'file'): string
    {
        $ext  = self::validate($file, $kind, $field);
        $path = trim($dir, '/') . '/' . Str::uuid() . '.' . $ext;

        // put() con contenido crudo: evita cabeceras ACL que R2 rechaza
        $ok = Storage::disk($disk)->put($path, file_get_contents($file->getRealPath()));
        if (!$ok) {
            throw new \RuntimeException('No se pudo guardar el archivo.');
        }

        return $path;
    }
}
