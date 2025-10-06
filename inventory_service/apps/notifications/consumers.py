# apps/notifications/consumers.py
from channels.generic.websocket import AsyncJsonWebsocketConsumer
import json

class CompanyConsumer(AsyncJsonWebsocketConsumer):
    """
    WebSocket consumer for per-company channel.
    URL: ws://.../ws/company/<company_id>/?token=...
    Clients in group 'company_{company_id}' will receive messages.
    """

    async def connect(self):
        self.company_id = self.scope['url_route']['kwargs']['company_id']
        self.group_name = f"company_{self.company_id}"

        # optionally require authenticated user
        user = self.scope.get('user')
        if not getattr(user, 'is_authenticated', False):
            # reject if you want
            await self.close()
            return

        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()
        # Optionally send welcome
        await self.send_json({"type":"welcome","msg":"connected","company_id":str(self.company_id)})

    async def disconnect(self, code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive_json(self, content, **kwargs):
        # handle client-sent messages if needed (e.g. pings)
        # For now echo or ignore
        await self.send_json({"echo": content})

    # Handler for messages sent via group_send
    async def company_message(self, event):
        """
        Event structure:
        {
          "type":"company_message",
          "payload": {...}
        }
        """
        payload = event.get('payload')
        await self.send_json({"type":"company_message","payload": payload})
