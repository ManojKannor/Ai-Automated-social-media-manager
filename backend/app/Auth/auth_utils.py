from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt # pip install pyjwt

# Configuration
AUTH0_DOMAIN = "dev-2543cqv5siqcffcy.us.auth0.com"
API_AUDIENCE = "https://dev-2543cqv5siqcffcy.us.auth0.com/api/v2/" # From Auth0 API settings
ALGORITHMS = ["RS256"]
NAMESPACE = 'https://my-app-name/roles' # Must match Auth0 Action

security = HTTPBearer()

def get_current_user_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    try:
        # NOTE: In production, fetch the JWKS public key from Auth0 to verify signature!
        # For simplicity here, we assume standard decoding (you should add signature verification)
        payload = jwt.decode(token, options={"verify_signature": False}) 
        return payload
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")

def verify_admin_role(payload: dict = Depends(get_current_user_token)):
    roles = payload.get(NAMESPACE, [])
    if "admin" not in roles:
        raise HTTPException(
            status_code=403, 
            detail="Access Forbidden: Admins only"
        )
    return payload