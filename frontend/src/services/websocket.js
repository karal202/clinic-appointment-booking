import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { BASE_URL } from './api';

class WebSocketService {
    constructor() {
        this.client = null;
        this.onSlotUpdate = null;
        this.onDoctorUpdate = null;
        this.onAppointmentUpdate = null;
        this.onMessage = null;
    }

    connect() {
        if (this.client && this.client.active) return;

        const socket = new SockJS('http://localhost:8080/ws');
        this.client = new Client({
            webSocketFactory: () => socket,
            onConnect: () => {
                console.log('Connected to WebSocket');

                // helper: parse JSON nếu được, không thì trả raw string
                const safeParse = (body) => {
                    try { return JSON.parse(body); } catch { return body; }
                };

                // slots topic — backend có thể gửi plain text (số id, "cleanup"...)
                this.client.subscribe('/topic/slots', (message) => {
                    const payload = safeParse(message.body);
                    console.debug('[WS] /topic/slots', payload);
                    if (this.onSlotUpdate) this.onSlotUpdate(payload);
                });

                // doctor updates (workingRoom changes)
                this.client.subscribe('/topic/doctors', (message) => {
                    const payload = safeParse(message.body);
                    console.debug('[WS] /topic/doctors', payload);
                    if (this.onDoctorUpdate) this.onDoctorUpdate(payload);
                });

                // appointment updates (assignedRoom / status changes)
                this.client.subscribe('/topic/appointments', (message) => {
                    const payload = safeParse(message.body);
                    console.debug('[WS] /topic/appointments', payload);
                    if (this.onAppointmentUpdate) this.onAppointmentUpdate(payload);
                });
            },
            onStompError: (frame) => {
                console.error('STOMP error', frame);
            },
        });
        this.client.activate();
    }

    setSlotUpdateHandler(handler) {
        this.onSlotUpdate = handler;
    }

    setDoctorUpdateHandler(handler) {
        this.onDoctorUpdate = handler;
    }

    setAppointmentUpdateHandler(handler) {
        this.onAppointmentUpdate = handler;
    }

    disconnect() {
        if (this.client) {
            this.client.deactivate();
        }
    }
}

const webSocketService = new WebSocketService();
export default webSocketService;
