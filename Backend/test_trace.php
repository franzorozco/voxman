<?php
try {
    function throwError() {
        new NonExistentClass();
    }
    function updateStatus() {
        throwError();
    }
    updateStatus();
} catch (\Throwable $e) {
    echo "TRACE:\n" . $e->getTraceAsString();
}
