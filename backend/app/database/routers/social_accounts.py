from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from app.database.database import get_session
from app.database.models.social_accounts import SocialAccounts

from app.database.schemas.social_accounts import SocialAccountCreate


router = APIRouter(prefix="/accounts", tags=["Social Accounts"])

# Create account
@router.post("/")
def create_account(account_data: SocialAccountCreate, session: Session = Depends(get_session)):

    account = SocialAccounts(**account_data.dict())

    session.add(account)
    session.commit()
    session.refresh(account)
    return {"message": "Account saved", "data": account}


# Get all accounts
@router.get("/")
def get_accounts(session: Session = Depends(get_session)):
    return session.exec(select(SocialAccounts)).all()


