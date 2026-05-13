import csv
import requests
from bs4 import BeautifulSoup

url = "http://www.naver.com/"

resp = requests.get(url)

soup = BeautifulSoup(resp.text, "html.parser")













































