import { NextRequest, NextResponse } from 'next/server';
import { pdf } from '@react-pdf/renderer';
import { receiptPDF } from '@/app/order/[id]/Receipt';
import { cookies } from 'next/headers';
import { OrderData } from '@/app/order/[id]/types';

async function getOrder(token: string, id: string): Promise<OrderData | null> {
    try {
        const baseURL = process.env.NEXT_PUBLIC_API_PREFIX || "http://localhost:8081/api/v1";

        const response = await fetch(`${baseURL}/orders/${id}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            console.error(`Failed to fetch order: ${response.status} ${response.statusText}`);
            return null;
        }

        const data = await response.json();
        return data as OrderData;
    } catch (error) {
        console.error('Error fetching order:', error);
        return null;
    }
}

export async function GET(
    request: NextRequest,
    { params }: { params: { orderId: string } }
) {
    try {
        const { orderId } = params;
        console.log('Processing PDF generation for order:', orderId);

        // Validation de orderId
        if (!orderId || orderId.trim() === '') {
            console.error('Missing orderId');
            return new NextResponse('ID de commande requis', { status: 400 });
        }

        // Récupération des cookies
        const cookieStore = await cookies();
        const token = cookieStore.get("chicken-nation-token");

        if (!token || !token.value) {
            console.error('Missing authentication token');
            return new NextResponse('Utilisateur non authentifié', { status: 401 });
        }

        // Récupération des données de la commande
        console.log('Fetching order data...');
        const orderData = await getOrder(token.value, orderId);

        if (!orderData) {
            console.error('Order not found:', orderId);
            return new NextResponse('Commande non trouvée', { status: 404 });
        }

        // Validation et nettoyage des données de la commande
        if (!orderData.order_items || !Array.isArray(orderData.order_items) || orderData.order_items.length === 0) {
            console.error('Invalid order data structure:', orderData);
            return new NextResponse('Données de commande invalides', { status: 400 });
        }

        // Validation des données requises pour le PDF
        if (!orderData.restaurant || !orderData.restaurant.name) {
            console.error('Missing restaurant data');
            return new NextResponse('Données de restaurant manquantes', { status: 400 });
        }

        // Nettoyage et validation des données pour éviter les erreurs undefined
        const cleanOrderData = {
            ...orderData,
            reference: orderData.reference || `ORDER-${orderId}`,
            date: orderData.date || new Date().toISOString().split('T')[0],
            time: orderData.time || new Date().toLocaleTimeString('fr-FR'),
            phone: orderData.phone || '',
            type: orderData.type || 'DELIVERY',
            status: orderData.status || 'PENDING',
            net_amount: orderData.net_amount || 0,
            amount: orderData.amount || 0,
            discount: orderData.discount || 0,
            delivery_fee: orderData.delivery_fee || 0,
            tax: orderData.tax || 0,
            points: orderData.points || 0,
            note: orderData.note || '',
            code_promo: orderData.code_promo || '',
            address: orderData.address || '',
            estimated_delivery_time: orderData.estimated_delivery_time || '',
            customer: {
                first_name: orderData.customer?.first_name || '',
                last_name: orderData.customer?.last_name || '',
                ...orderData.customer
            },
            restaurant: {
                name: orderData.restaurant.name || 'Restaurant',
                address: orderData.restaurant.address || '',
                phone: orderData.restaurant.phone || '',
                email: orderData.restaurant.email || '',
                ...orderData.restaurant
            },
            order_items: orderData.order_items.map(item => ({
                ...item,
                quantity: item.quantity || 1,
                amount: item.amount || 0,
                epice: item.epice || false,
                dish: {
                    name: item.dish?.name || 'Plat sans nom',
                    description: item.dish?.description || '',
                    is_promotion: item.dish?.is_promotion || false,
                    ...item.dish
                },
                supplements: item.supplements?.map(sup => ({
                    name: sup.name || 'Supplément',
                    price: sup.price || 0,
                    ...sup
                })) || []
            })),
            paiements: orderData.paiements?.map(payment => ({
                status: payment.status || 'PENDING',
                mode: payment.mode || 'CASH',
                reference: payment.reference || '',
                amount: payment.amount || 0,
                fees: payment.fees || 0,
                ...payment
            })) || []
        };

        console.log('Order data cleaned and validated');

        console.log('Generating PDF...');

        // CORRECTION : Passer "order" au lieu de "orderData" avec données nettoyées
        const pdfBuffer: Buffer = await pdf(receiptPDF({ order: cleanOrderData })).toBuffer();

        console.log('PDF generated successfully, size:', pdfBuffer.length);

        // Définition des en-têtes de réponse
        const headers = new Headers({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `inline; filename="recu-${cleanOrderData.reference || orderId}.pdf"`,
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
            // 'Content-Length': pdfBuffer.length.toString()
        });

        return new NextResponse(pdfBuffer, { headers });

    } catch (error) {
        console.error('Erreur génération PDF:', error);

        // Log détaillé de l'erreur
        if (error instanceof Error) {
            console.error('Error name:', error.name);
            console.error('Error message:', error.message);
            console.error('Error stack:', error.stack);
        }

        // Gestion spécifique des erreurs
        if (error instanceof Error) {
            if (error.message.includes('fetch') || error.message.includes('network')) {
                return new NextResponse('Erreur de connexion au serveur', { status: 503 });
            }
            if (error.message.includes('PDF') || error.message.includes('render')) {
                return new NextResponse('Erreur lors de la génération du PDF: ' + error.message, { status: 500 });
            }
            if (error.message.includes('JSON')) {
                return new NextResponse('Erreur de parsing des données', { status: 422 });
            }
        }

        return new NextResponse('Erreur interne du serveur: ' + (error instanceof Error ? error.message : 'Unknown error'), { status: 500 });
    }
}