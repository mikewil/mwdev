<?php
declare(strict_types=1);

require __DIR__ . '/../public/contact.php';

function contact_expect(bool $condition, string $message): void
{
    if (!$condition) {
        fwrite(STDERR, "FAIL: {$message}\n");
        exit(1);
    }
}

$missing = validate_contact_submission([]);
contact_expect(isset($missing['errors']['name']), 'name is required');
contact_expect(isset($missing['errors']['email']), 'email is required');
contact_expect(isset($missing['errors']['message']), 'message is required');

$invalidEmail = validate_contact_submission([
    'name' => 'Ada Lovelace',
    'email' => "ada@example.com\r\nBcc: attacker@example.com",
    'message' => 'Hello',
]);
contact_expect(isset($invalidEmail['errors']['email']), 'email header injection is rejected');

$oversized = validate_contact_submission([
    'name' => str_repeat('n', 121),
    'email' => 'ada@example.com',
    'message' => str_repeat('m', 5001),
]);
contact_expect(isset($oversized['errors']['name']), 'oversized name is rejected');
contact_expect(isset($oversized['errors']['message']), 'oversized message is rejected');

$valid = validate_contact_submission([
    'name' => 'Ada Lovelace',
    'email' => 'ada@example.com',
    'message' => 'I would like to discuss a project.',
]);
contact_expect($valid['errors'] === [], 'valid submission has no errors');

$sentEmail = null;
$sent = send_contact_email($valid['data'], static function (string $to, string $subject, string $body, string $headers) use (&$sentEmail): bool {
    $sentEmail = compact('to', 'subject', 'body', 'headers');
    return true;
});
contact_expect($sent, 'mail transport reports success');
contact_expect($sentEmail['to'] === 'mike@mwilliams.dev', 'recipient is fixed');
contact_expect($sentEmail['subject'] === 'Site Inquiry', 'subject is fixed');
contact_expect(str_contains($sentEmail['headers'], 'Reply-To: ada@example.com'), 'reply-to uses validated visitor email');

fwrite(STDOUT, "Contact PHP tests passed.\n");
