import random
import string

def generate_random_password(length=8):
    chars = string.ascii_letters + string.digits
    return ''.join(random.choice(chars) for i in range(length))


print("8글자", generate_random_password())
print("16글자", generate_random_password(16))
print("32글자", generate_random_password(32))








































