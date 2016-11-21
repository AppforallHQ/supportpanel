import settings
import requests

from base64 import b64encode


class Get_Header():
    def __init__(self, service):
        self.service = service
        self.username = None
        self.password = None
        self.gen_endpoint = None
        self.chk_endpoint = None

        self.token = {}

        self.generate_auth_data()

    def generate_auth_data(self):
        if self.service == "users":
            self.username = settings.USERS_USER
            self.password = settings.USERS_PASS
            self.gen_endpoint = settings.USERS_API_URL+ "new.json"

        elif self.service == "f5":
            self.username = settings.F5_USER
            self.password = settings.F5_PASS
            self.gen_endpoint = settings.F5_API_URL+ "new.json"


    def get_api_token(self):
        data = {'username': self.username,
                'password': self.password}

        self.token = requests.post(self.gen_endpoint, data=data).json()

    def check_api_token(self):
        if self.service == "users":
            API_URL = settings.USERS_API_URL
        elif self.service == "f5":
            API_URL = settings.F5_API_URL
        self.chk_endpoint = API_URL + self.token['token'] + '/' + str(self.token['user']) + '.json'

        res = requests.get(self.chk_endpoint).json()

        if res['success'] == True:
            return True
        self.get_api_token()


    def get_api_header(self):
        if not self.token:
            self.get_api_token()
        else:
            self.check_api_token()

        token_str = str(self.token['user']) + ":" + self.token['token']
        auth_value = 'Basic '.encode('ascii') + b64encode(token_str.encode('ascii'))
        return {'Authorization': auth_value}
