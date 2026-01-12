import os
from dotenv import load_dotenv
from sqlmodel import SQLModel,create_engine , Session
username = 'root'
password = 'system12'
port = 3306
host = f'@localhost:{port}'
db_name = "ai_social"

load_dotenv()

db_user = os.getenv("db_user")
db_password = os.getenv("db_pass")
db_host = os.getenv("host")
db_port = os.getenv("port")
db_name = os.getenv("db_name")

DATABASE_URL = f"mysql+pymysql://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}"

engine = create_engine(DATABASE_URL,echo=True)

def create_db_and_tables():
    SQLModel.metadata.create_all(engine)


#Session -> Open DB connection for querying
def get_session():
    with Session(engine) as session:
        yield session