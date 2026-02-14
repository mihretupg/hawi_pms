import base64
import hashlib
import hmac
import secrets

PBKDF2_ALG = "pbkdf2_sha256"
PBKDF2_ITERATIONS = 200_000
PBKDF2_SALT_BYTES = 16


def hash_password(password: str) -> str:
    salt = secrets.token_bytes(PBKDF2_SALT_BYTES)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, PBKDF2_ITERATIONS)
    return _encode_password_hash(salt, digest)


def verify_password(password: str, stored_hash: str) -> bool:
    try:
        alg, iterations, salt_b64, digest_b64 = stored_hash.split("$", 3)
    except ValueError:
        return False

    if alg != PBKDF2_ALG:
        return False

    try:
        iterations_int = int(iterations)
        salt = base64.b64decode(salt_b64.encode("utf-8"))
        expected_digest = base64.b64decode(digest_b64.encode("utf-8"))
    except (ValueError, TypeError):
        return False

    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, iterations_int)
    return hmac.compare_digest(digest, expected_digest)


def _encode_password_hash(salt: bytes, digest: bytes) -> str:
    salt_b64 = base64.b64encode(salt).decode("utf-8")
    digest_b64 = base64.b64encode(digest).decode("utf-8")
    return f"{PBKDF2_ALG}${PBKDF2_ITERATIONS}${salt_b64}${digest_b64}"
