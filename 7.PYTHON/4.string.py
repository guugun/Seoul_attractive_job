s= "hello world"



print(s)
print(s.lower()) #소문자로 변환
print(s.upper()) #대문자로 변환
print(s.capitalize()) #첫 글자만 대문자로 변환
print(s.title()) #각 단어의 첫 글자만 대문자로 변환)
      
s = "   hello world   "
print(s.strip()) #문자열 양쪽의 공백 제거
s_list = s.split() #문자열을 공백을 기준으로 나누어 리스트로 반환

print(",".join(s_list)) #리스트의 요소들을 ","로 연결하여 문자열로 반환



















