export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://rajnish238-tncbackend.hf.space';

export const API_CONFIG = {
    headers: {
        'Cookie': 'spaces-jwt=eyJhbGciOiJFZERTQSJ9.eyJyZWFkIjp0cnVlLCJwZXJtaXNzaW9ucyI6eyJyZXBvLmNvbnRlbnQucmVhZCI6dHJ1ZX0sIm9uQmVoYWxmT2YiOnsia2luZCI6InVzZXIiLCJfaWQiOiI2NTJmOWYxM2EwZjUxNmE5OWRmZWEzMTciLCJ1c2VyIjoiUmFqbmlzaDIzOCIsInNlc3Npb25JZCI6IjY4NGFmM2Y5ZTQ1ZDExZGZjODg1MmFmZCJ9LCJpYXQiOjE3NDk3NjEzODYsInN1YiI6Ii9zcGFjZXMvUmFqbmlzaDIzOC90bmNiYWNrZW5kIiwiZXhwIjoxNzQ5ODQ3Nzg2LCJpc3MiOiJodHRwczovL2h1Z2dpbmdmYWNlLmNvIn0.HMsZTs9EYSex8N_eBd5ubXguFJWE9yL6y4dPqUnsJtKdq03NnWvk3i-4cwcM_9tCHo7G60EOtCBbSxyatNATBQ',
        'Content-Type': 'application/json'
    },
    credentials: 'include' as RequestCredentials
}; 