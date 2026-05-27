<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

$dataFile = __DIR__ . '/data.json';

// Pomoćna funkcija za čitanje podataka
function getData() {
    global $dataFile;
    if (!file_exists($dataFile)) {
        // Bootstrap početnog stanja
        $defaultState = [
            "users" => [
                [
                    "id" => "admin-1",
                    "username" => "admin",
                    "pin" => hash('sha256', 'admin321a'), // Generira aa97e1cadbb64..
                    "role" => "ADMIN",
                    "permissions" => [
                        "kredit" => true, "uplate" => true, "ustede" => true, "materijali" => true,
                        "dostava" => true, "radovi" => true, "kategorije" => true, "izvjesca" => true,
                        "adminZona" => true, "backup" => true, "readOnly" => false, "allowedCategories" => []
                    ]
                ]
            ],
            "categories" => [
                ["id" => "1", "name" => "Kuhinja"],
                ["id" => "2", "name" => "Kupaonica"],
                ["id" => "3", "name" => "Dnevni boravak"]
            ],
            "materials" => [], "deliveries" => [], "works" => [], "savings" => [], "payments" => [], "auditLogs" => []
        ];
        file_put_contents($dataFile, json_encode($defaultState, JSON_PRETTY_PRINT));
        return $defaultState;
    }
    return json_decode(file_get_contents($dataFile), true);
}

// 1. LOGIN RUTIRANJE (/api/login simulacija na PHP-u)
if (isset($_GET['action']) && $_GET['action'] === 'login') {
    $input = json_decode(file_get_contents('php://input'), true);
    $data = getData();
    
    foreach ($data['users'] as $user) {
        if (strtolower($user['username']) === strtolower($input['username'])) {
            $hashedPin = hash('sha256', $input['pin']);
            if ($user['pin'] === $hashedPin || $user['pin'] === $input['pin']) {
                $safeUser = $user;
                unset($safeUser['pin']); // Brišemo PIN pri slanju frontend-u!
                echo json_encode(["success" => true, "user" => $safeUser]);
                exit;
            }
        }
    }
    http_response_code(401);
    echo json_encode(["error" => "Invalid credentials"]);
    exit;
}

// 2. GET STATE (/api/state GET simulacija na PHP-u)
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $data = getData();
    // UKLANJAMO PINOVE prije slanja frontend klijentu
    if (isset($data['users']) && is_array($data['users'])) {
        foreach ($data['users'] as &$user) {
            unset($user['pin']);
        }
    }
    echo json_encode($data);
    exit;
}

// 3. POST STATE (/api/state POST simulacija na PHP-u)
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $incomingState = json_decode(file_get_contents('php://input'), true);
    $existingData = getData();
    
    if (isset($incomingState['users']) && isset($existingData['users'])) {
        foreach ($incomingState['users'] as &$incomingUser) {
            // Tražimo postojećeg usera da prenesemo HASH PIN pošto nam frontend nije poslao hash
            $found = false;
            foreach ($existingData['users'] as $existingUser) {
                if ($existingUser['id'] === $incomingUser['id']) {
                    if (empty($incomingUser['pin']) && !empty($existingUser['pin'])) {
                        $incomingUser['pin'] = $existingUser['pin'];
                    }
                    $found = true;
                    break;
                }
            }
        }
    }
    
    file_put_contents($dataFile, json_encode($incomingState, JSON_PRETTY_PRINT));
    echo json_encode(["success" => true]);
    exit;
}
?>
