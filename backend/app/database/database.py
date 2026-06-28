import os
from dotenv import load_dotenv
from sqlmodel import SQLModel,create_engine , Session


load_dotenv()

db_user = os.getenv("db_user")
db_password = os.getenv("db_pass")
db_host = os.getenv("host")
db_port = os.getenv("port")
db_name = os.getenv("db_name")

# Environment se URL lo (Render par ye Supabase wala hoga)
DATABASE_URL = f"mysql+pymysql://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}"

# Agar URL nahi mila, to error dikhao
if not DATABASE_URL:
    raise ValueError("DATABASE_URL is missing! Please check .env or Render settings.")

# # Render ka URL kabhi-kabhi 'postgres://' hota hai, usko 'postgresql://' me badlo
# if DATABASE_URL.startswith("postgres://"):
#     DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

engine = create_engine(DATABASE_URL,echo=True)

def create_db_and_tables():
    SQLModel.metadata.create_all(engine)


#Session -> Open DB connection for querying
def get_session():
    with Session(engine) as session:
        yield session