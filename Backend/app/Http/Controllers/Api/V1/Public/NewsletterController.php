<?php

namespace App\Http\Controllers\Api\V1\Public;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Catalog\NewsletterSubscriber;
use Carbon\Carbon;
use Illuminate\Support\Facades\Validator;

class NewsletterController extends Controller
{
    public function subscribe(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Por favor ingresa un correo válido.'
            ], 422);
        }

        $email = strtolower(trim($request->email));
        $ip = $request->ip();

        // 1. Check if email is already subscribed
        $existing = NewsletterSubscriber::where('email', $email)->first();
        if ($existing) {
            return response()->json([
                'status' => 'success',
                'message' => '¡Tu correo ya está registrado en nuestro club!'
            ]);
        }

        // 2. Rate Limiting: Check how many registrations from this IP in the last hour
        $recentRegistrations = NewsletterSubscriber::where('ip_address', $ip)
            ->where('created_at', '>=', Carbon::now()->subHour())
            ->count();

        if ($recentRegistrations >= 3) {
            return response()->json([
                'status' => 'error',
                'message' => 'Demasiados intentos. Por favor intenta de nuevo más tarde.'
            ], 429);
        }

        // 3. Register the subscriber
        NewsletterSubscriber::create([
            'email' => $email,
            'ip_address' => $ip,
            'is_active' => true
        ]);

        return response()->json([
            'status' => 'success',
            'message' => '¡Gracias por unirte al club VØXman! Te avisaremos de nuestras novedades.'
        ], 201);
    }
}
