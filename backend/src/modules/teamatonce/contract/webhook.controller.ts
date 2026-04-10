import {
  Controller,
  Post,
  Headers,
  Request,
  HttpStatus,
  HttpCode,
  BadRequestException,
  RawBodyRequest,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiExcludeEndpoint } from '@nestjs/swagger';
import { PaymentService } from './payment.service';

/**
 * Payment Webhook Controller
 * Handles Stripe webhook events (PUBLIC - no auth required)
 * Authentication is done via Stripe signature verification
 */
@ApiTags('Payment Webhooks')
@Controller('payment/webhook')
export class PaymentWebhookController {
  constructor(private readonly paymentService: PaymentService) {}

  /**
   * Stripe webhook handler
   * Receives and processes Stripe payment events with signature verification
   */
  @Post('stripe')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Stripe webhook handler',
    description: 'Receives and processes Stripe payment events. Authentication is via Stripe signature.',
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'Webhook processed successfully' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid webhook signature' })
  async handleStripeWebhook(
    @Headers('stripe-signature') signature: string,
    @Request() req: RawBodyRequest<Request>,
  ) {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.warn('[Stripe Webhook] STRIPE_WEBHOOK_SECRET not configured');
    }

    let event: any;

    // Verify the Stripe webhook signature
    if (webhookSecret && signature) {
      try {
        // Use Stripe SDK to verify the signature
        const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
        const rawBody = req.rawBody;

        if (!rawBody) {
          throw new BadRequestException('Missing raw body for webhook verification');
        }

        event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
        console.log(`[Stripe Webhook] Verified event: ${event.type}`);
      } catch (err) {
        console.error('[Stripe Webhook] Signature verification failed:', err.message);
        throw new BadRequestException(`Webhook signature verification failed: ${err.message}`);
      }
    } else {
      // Fallback for development (NOT recommended for production)
      event = req.body;
      console.warn('[Stripe Webhook] Processing without signature verification (development only)');
    }

    // Handle the event
    try {
      switch (event.type) {
        case 'payment_intent.succeeded':
          console.log(`[Stripe Webhook] Payment intent succeeded: ${event.data.object.id}`);
          await this.paymentService.handleStripePaymentSuccess(
            event.data.object.id,
            event.data.object,
          );
          break;

        case 'payment_intent.payment_failed':
          console.log(`[Stripe Webhook] Payment intent failed: ${event.data.object.id}`);
          await this.paymentService.handleStripePaymentFailure(
            event.data.object.id,
            event.data.object.last_payment_error,
          );
          break;

        case 'charge.succeeded':
          console.log(`[Stripe Webhook] Charge succeeded: ${event.data.object.id}`);
          // Additional handling if needed
          break;

        case 'charge.refunded':
          console.log(`[Stripe Webhook] Charge refunded: ${event.data.object.id}`);
          // Handle refund - update payment status
          break;

        case 'checkout.session.completed':
          console.log(`[Stripe Webhook] Checkout session completed: ${event.data.object.id}`);
          // Handle checkout session completion
          break;

        case 'customer.subscription.created':
        case 'customer.subscription.updated':
        case 'customer.subscription.deleted':
          console.log(`[Stripe Webhook] Subscription event: ${event.type} - ${event.data.object.id}`);
          // Handle subscription events
          break;

        case 'invoice.paid':
          console.log(`[Stripe Webhook] Invoice paid: ${event.data.object.id}`);
          break;

        case 'invoice.payment_failed':
          console.log(`[Stripe Webhook] Invoice payment failed: ${event.data.object.id}`);
          break;

        default:
          console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
      }

      return { received: true };
    } catch (error) {
      console.error(`[Stripe Webhook] Error processing event ${event.type}:`, error);
      // Still return 200 to acknowledge receipt, log the error for investigation
      return { received: true, error: 'Processing error logged' };
    }
  }
}
