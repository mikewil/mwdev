<?php
declare(strict_types=1);

const CONTACT_RECIPIENT = 'mike@mwilliams.dev';
const CONTACT_SUBJECT = 'Site Inquiry';

/**
 * @param array<string, mixed> $input
 * @return array{data: array{name: string, email: string, message: string}, errors: array<string, string>}
 */
function validate_contact_submission(array $input): array
{
    $data = [
        'name' => is_string($input['name'] ?? null) ? trim($input['name']) : '',
        'email' => is_string($input['email'] ?? null) ? trim($input['email']) : '',
        'message' => is_string($input['message'] ?? null) ? trim($input['message']) : '',
    ];
    $errors = [];

    if ($data['name'] === '') {
        $errors['name'] = 'Enter your name.';
    } elseif (mb_strlen($data['name'], 'UTF-8') > 120) {
        $errors['name'] = 'Name must be 120 characters or fewer.';
    }

    if ($data['email'] === '') {
        $errors['email'] = 'Enter your email address.';
    } elseif (
        mb_strlen($data['email'], 'UTF-8') > 254 ||
        filter_var($data['email'], FILTER_VALIDATE_EMAIL) === false
    ) {
        $errors['email'] = 'Enter a valid email address.';
    }

    if ($data['message'] === '') {
        $errors['message'] = 'Enter a message.';
    } elseif (mb_strlen($data['message'], 'UTF-8') > 5000) {
        $errors['message'] = 'Message must be 5000 characters or fewer.';
    }

    return ['data' => $data, 'errors' => $errors];
}

/**
 * @param array{name: string, email: string, message: string} $data
 * @return array{to: string, subject: string, body: string, headers: string}
 */
function build_contact_email(array $data): array
{
    return [
        'to' => CONTACT_RECIPIENT,
        'subject' => CONTACT_SUBJECT,
        'body' => "Name: {$data['name']}\nEmail: {$data['email']}\n\n{$data['message']}",
        'headers' => implode("\r\n", [
            'From: MWilliams Portfolio <' . CONTACT_RECIPIENT . '>',
            'Reply-To: ' . $data['email'],
            'Content-Type: text/plain; charset=UTF-8',
        ]),
    ];
}

/**
 * @param array{name: string, email: string, message: string} $data
 */
function send_contact_email(array $data, ?callable $mailer = null): bool
{
    $email = build_contact_email($data);

    if ($mailer !== null) {
        return $mailer($email['to'], $email['subject'], $email['body'], $email['headers']) === true;
    }

    return @mail($email['to'], $email['subject'], $email['body'], $email['headers']);
}

/** @param array<string, mixed> $payload */
function contact_json_response(int $status, array $payload): never
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    echo json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_INVALID_UTF8_SUBSTITUTE);
    exit;
}

function handle_contact_request(): never
{
    if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
        header('Allow: POST');
        contact_json_response(405, ['ok' => false, 'message' => 'Method not allowed.']);
    }

    if (is_string($_POST['website'] ?? null) && trim($_POST['website']) !== '') {
        contact_json_response(200, ['ok' => true]);
    }

    $validation = validate_contact_submission($_POST);
    if ($validation['errors'] !== []) {
        contact_json_response(422, ['ok' => false, 'errors' => $validation['errors']]);
    }

    if (!send_contact_email($validation['data'])) {
        contact_json_response(500, ['ok' => false, 'message' => 'Message could not be sent.']);
    }

    contact_json_response(200, ['ok' => true]);
}

if (realpath($_SERVER['SCRIPT_FILENAME'] ?? '') === __FILE__) {
    handle_contact_request();
}
