from fastapi import APIRouter, Depends
from sqlmodel import SQLModel , Session , select
from app.database.database import get_session
from app.database.models.social_accounts import SocialAccounts


router = APIRouter()

@router.get("/connected/accounts/{user_id}")
async def connected_accounts(user_id : str ,session : Session = Depends(get_session)):
    statement = select(SocialAccounts).where((SocialAccounts.user_id == user_id) & (SocialAccounts.status == "valid") )
    C_accounts = session.exec(statement).all()
    if not C_accounts:
        return {"msg" : "not found account"}
    else:
        return C_accounts


@router.delete("/disconnect/{user_id}/{platform}")
async def disconnect_account(user_id : str , platform : str, session : Session = Depends(get_session)):
    statement = select(SocialAccounts).where((SocialAccounts.user_id == user_id) & (SocialAccounts.platform == platform))
    delete_acc = session.exec(statement).first()

    if not delete_acc:
        return {"error msg" : "account not found"}

    session.delete(delete_acc)
    session.commit()


    return {"msg" : "account deleted"}



