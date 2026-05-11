import requests


resp = requests.get("https://api.github.com")

if (resp.status_code ==200):
    print(resp.text)

else : 
    print("요청 실패", resp.status_code)


















