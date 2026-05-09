import json
from django.http import JsonResponse


def get_axes_username(request, credentials=None):
    if credentials:
        return credentials.get('username')
    
    username = None
    if request.content_type == 'application/json' and request.body:
        try:
            data = json.loads(request.body)
            username = data.get('username')
        except:
            pass
    
    if not username:
        username = request.POST.get('username')
        
    return username

from axes.helpers import get_cool_off

def axes_lockout_response(request, credentials, *args, **kwargs):
    cool_off = get_cool_off()
    message = "Account locked: too many login attempts."
    if cool_off:
        minutes = int(cool_off.total_seconds() / 60)
        message += f" Please try again in {minutes} minutes."
    else:
        message += " Please try again later."
        
    return JsonResponse(
        {"detail": message},
        status=429
    )





