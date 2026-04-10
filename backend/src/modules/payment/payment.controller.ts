import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpStatus,
  HttpCode,
  RawBodyRequest,
  Req,
  Headers,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { StripeService } from './stripe.service';
import { PaymentService } from './payment.service';
import {
  CreateSubscriptionDto,
  UpdateSubscriptionDto,
  CancelSubscriptionDto,
  AddPaymentMethodDto,
  CreateCheckoutSessionDto,
  SubscriptionResponseDto,
  PaymentMethodResponseDto,
} from './dto/payment.dto';

/**
 * Payment Controller
 *
 * Exposes Stripe payment functionality via REST API
 * Handles subscriptions, payment methods, invoices, checkout, and webhooks
 */
@ApiTags('Payment & Subscription Management')
@Controller('payment')
export class PaymentController {
  constructor(
    private readonly stripeService: StripeService,
    private readonly paymentService: PaymentService,
  ) {}

  // ============================================
  // CUSTOMER MANAGEMENT
  // ============================================

  @Post('customer')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create or get Stripe customer for current user' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Customer created or retrieved successfully',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string', example: 'user@example.com' },
        metadata: {
          type: 'object',
          example: { companyId: '123e4567-e89b-12d3-a456-426614174000' },
        },
      },
      required: ['email'],
    },
  })
  async createOrGetCustomer(
    @Request() req: any,
    @Body('email') email: string,
    @Body('metadata') metadata?: Record<string, string>,
  ) {
    const userId = req.user.sub || req.user.userId;
    return this.stripeService.createOrGetCustomer(email, userId, metadata);
  }

  @Get('customer/:customerId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get customer details by Stripe customer ID' })
  @ApiParam({ name: 'customerId', description: 'Stripe customer ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Customer retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Customer not found',
  })
  async getCustomer(@Param('customerId') customerId: string) {
    return this.stripeService.getCustomer(customerId);
  }

  @Put('customer/:customerId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update customer details' })
  @ApiParam({ name: 'customerId', description: 'Stripe customer ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Customer updated successfully',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string', example: 'newemail@example.com' },
        name: { type: 'string', example: 'John Doe' },
        phone: { type: 'string', example: '+1234567890' },
        metadata: { type: 'object' },
      },
    },
  })
  async updateCustomer(
    @Param('customerId') customerId: string,
    @Body() updateData: any,
  ) {
    return this.stripeService.updateCustomer(customerId, updateData);
  }

  // ============================================
  // SUBSCRIPTION MANAGEMENT
  // ============================================

  @Post('subscription')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new subscription' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Subscription created successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Failed to create subscription',
  })
  async createSubscription(
    @Request() req: any,
    @Body() dto: CreateSubscriptionDto,
  ) {
    const userId = req.user.sub || req.user.userId;

    // Create or get customer first
    const customer = await this.stripeService.createOrGetCustomer(
      dto.email || req.user.email,
      userId,
      dto.metadata,
    );

    return this.stripeService.createSubscription(
      customer.id,
      dto.priceId,
      dto.paymentMethodId,
      dto.metadata,
    );
  }

  @Get('subscription/:subscriptionId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get subscription details' })
  @ApiParam({ name: 'subscriptionId', description: 'Stripe subscription ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Subscription retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Subscription not found',
  })
  async getSubscription(@Param('subscriptionId') subscriptionId: string) {
    return this.stripeService.getSubscription(subscriptionId);
  }

  @Put('subscription/:subscriptionId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update subscription (upgrade/downgrade plan)' })
  @ApiParam({ name: 'subscriptionId', description: 'Stripe subscription ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Subscription updated successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Failed to update subscription',
  })
  async updateSubscription(
    @Param('subscriptionId') subscriptionId: string,
    @Body() dto: UpdateSubscriptionDto,
  ) {
    if (!dto.newPriceId) {
      throw new BadRequestException('newPriceId is required');
    }

    return this.stripeService.updateSubscription(
      subscriptionId,
      dto.newPriceId,
      dto.prorate ?? true,
    );
  }

  @Post('subscription/:subscriptionId/cancel')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Cancel subscription (immediately or at period end)',
  })
  @ApiParam({ name: 'subscriptionId', description: 'Stripe subscription ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Subscription cancelled successfully',
  })
  async cancelSubscription(
    @Param('subscriptionId') subscriptionId: string,
    @Body() dto: CancelSubscriptionDto,
  ) {
    return this.stripeService.cancelSubscription(
      subscriptionId,
      dto.immediate ?? false,
    );
  }

  @Post('subscription/:subscriptionId/resume')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Resume a canceled subscription' })
  @ApiParam({ name: 'subscriptionId', description: 'Stripe subscription ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Subscription resumed successfully',
  })
  async resumeSubscription(@Param('subscriptionId') subscriptionId: string) {
    return this.stripeService.resumeSubscription(subscriptionId);
  }

  @Get('customer/:customerId/subscriptions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all subscriptions for a customer' })
  @ApiParam({ name: 'customerId', description: 'Stripe customer ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Subscriptions retrieved successfully',
  })
  async listCustomerSubscriptions(@Param('customerId') customerId: string) {
    return this.stripeService.listCustomerSubscriptions(customerId);
  }

  // ============================================
  // PAYMENT METHOD MANAGEMENT
  // ============================================

  @Post('payment-method')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add payment method to customer' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Payment method added successfully',
  })
  async addPaymentMethod(
    @Request() req: any,
    @Body() dto: AddPaymentMethodDto,
  ) {
    const userId = req.user.sub || req.user.userId;

    // Get or create customer (requires email)
    const customer = await this.stripeService.createOrGetCustomer(
      req.user.email,
      userId,
    );

    const paymentMethod = await this.stripeService.attachPaymentMethod(
      dto.paymentMethodId,
      customer.id,
    );

    // Set as default if requested
    if (dto.setAsDefault) {
      await this.stripeService.setDefaultPaymentMethod(
        customer.id,
        dto.paymentMethodId,
      );
    }

    return paymentMethod;
  }

  @Get('customer/:customerId/payment-methods')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List payment methods for a customer' })
  @ApiParam({ name: 'customerId', description: 'Stripe customer ID' })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: ['card'],
    description: 'Payment method type',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Payment methods retrieved successfully',
  })
  async listPaymentMethods(
    @Param('customerId') customerId: string,
    @Query('type') type: 'card' = 'card',
  ) {
    return this.stripeService.listPaymentMethods(customerId, type);
  }

  @Delete('payment-method/:paymentMethodId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove payment method' })
  @ApiParam({
    name: 'paymentMethodId',
    description: 'Stripe payment method ID',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Payment method removed successfully',
  })
  async removePaymentMethod(@Param('paymentMethodId') paymentMethodId: string) {
    return this.stripeService.detachPaymentMethod(paymentMethodId);
  }

  @Put('customer/:customerId/default-payment-method')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Set default payment method for customer' })
  @ApiParam({ name: 'customerId', description: 'Stripe customer ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        paymentMethodId: {
          type: 'string',
          example: 'pm_1234567890',
        },
      },
      required: ['paymentMethodId'],
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Default payment method set successfully',
  })
  async setDefaultPaymentMethod(
    @Param('customerId') customerId: string,
    @Body('paymentMethodId') paymentMethodId: string,
  ) {
    return this.stripeService.setDefaultPaymentMethod(
      customerId,
      paymentMethodId,
    );
  }

  // ============================================
  // INVOICE MANAGEMENT
  // ============================================

  @Get('customer/:customerId/invoices')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List invoices for a customer' })
  @ApiParam({ name: 'customerId', description: 'Stripe customer ID' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of invoices to retrieve',
    example: 10,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Invoices retrieved successfully',
  })
  async listInvoices(
    @Param('customerId') customerId: string,
    @Query('limit') limit: number = 10,
  ) {
    return this.stripeService.listInvoices(customerId, Number(limit));
  }

  @Get('invoice/:invoiceId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get invoice details' })
  @ApiParam({ name: 'invoiceId', description: 'Stripe invoice ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Invoice retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Invoice not found',
  })
  async getInvoice(@Param('invoiceId') invoiceId: string) {
    return this.stripeService.getInvoice(invoiceId);
  }

  @Get('customer/:customerId/upcoming-invoice')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get upcoming invoice for customer' })
  @ApiParam({ name: 'customerId', description: 'Stripe customer ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Upcoming invoice retrieved successfully',
  })
  async getUpcomingInvoice(@Param('customerId') customerId: string) {
    return this.stripeService.getUpcomingInvoice(customerId);
  }

  // ============================================
  // CHECKOUT SESSION
  // ============================================

  @Post('checkout/session')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create Stripe Checkout session' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Checkout session created successfully',
  })
  async createCheckoutSession(
    @Request() req: any,
    @Body() dto: CreateCheckoutSessionDto,
  ) {
    const userId = req.user.sub || req.user.userId;

    // Get or create customer
    let customerId: string | undefined;
    if (req.user.email || dto.customerEmail) {
      const customer = await this.stripeService.createOrGetCustomer(
        req.user.email || dto.customerEmail!,
        userId,
        dto.metadata,
      );
      customerId = customer.id;
    }

    return this.stripeService.createCheckoutSession(
      dto.priceId,
      customerId,
      dto.customerEmail,
      dto.successUrl,
      dto.cancelUrl,
      dto.metadata,
    );
  }

  @Get('checkout/session/:sessionId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get checkout session details' })
  @ApiParam({ name: 'sessionId', description: 'Stripe checkout session ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Checkout session retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Checkout session not found',
  })
  async getCheckoutSession(@Param('sessionId') sessionId: string) {
    return this.stripeService.getCheckoutSession(sessionId);
  }

  // ============================================
  // PRICE MANAGEMENT
  // ============================================

  @Get('price/:priceId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get price details' })
  @ApiParam({ name: 'priceId', description: 'Stripe price ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Price retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Price not found',
  })
  async getPrice(@Param('priceId') priceId: string) {
    return this.stripeService.getPrice(priceId);
  }

  @Get('prices')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all active prices' })
  @ApiQuery({
    name: 'productId',
    required: false,
    type: String,
    description: 'Filter by Stripe product ID',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Prices retrieved successfully',
  })
  async listPrices(@Query('productId') productId?: string) {
    return this.stripeService.listPrices(productId);
  }

  // ============================================
  // WEBHOOK HANDLING
  // ============================================

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Stripe webhook handler (raw body required)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Webhook processed successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid webhook signature',
  })
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    if (!signature) {
      throw new BadRequestException('Missing stripe-signature header');
    }

    // Get raw body (must be configured in main.ts for /payment/webhook)
    const rawBody = req.rawBody;
    if (!rawBody) {
      throw new BadRequestException(
        'Raw body required for webhook verification',
      );
    }

    // Verify and construct event
    const event = this.stripeService.constructWebhookEvent(rawBody, signature);

    console.log(`[PaymentController] Received Stripe event: ${event.type}`);

    // IMPORTANT: Return response immediately to avoid timeout
    // Process database operations asynchronously after response
    setImmediate(() => {
      this.processWebhookEvent(event).catch((error) => {
        console.error(`[PaymentController] Error processing webhook ${event.type}:`, error);
      });
    });

    return { received: true, eventType: event.type };
  }

  /**
   * Process webhook event and persist to database
   * This runs asynchronously after webhook response is sent
   */
  private async processWebhookEvent(event: any): Promise<void> {
    try {
      switch (event.type) {
        // ============================================
        // SUBSCRIPTION EVENTS
        // ============================================
        case 'customer.subscription.created':
          console.log('[Webhook] Subscription created:', event.data.object.id);
          await this.paymentService.upsertSubscription(event.data.object);
          break;

        case 'customer.subscription.updated':
          console.log('[Webhook] Subscription updated:', event.data.object.id);
          await this.paymentService.upsertSubscription(event.data.object);
          break;

        case 'customer.subscription.deleted':
          console.log('[Webhook] Subscription deleted:', event.data.object.id);
          await this.paymentService.deleteSubscription(event.data.object.id);
          break;

        case 'customer.subscription.trial_will_end':
          console.log('[Webhook] Subscription trial ending:', event.data.object.id);
          await this.paymentService.upsertSubscription(event.data.object);
          break;

        // ============================================
        // PAYMENT INTENT EVENTS
        // ============================================
        case 'payment_intent.succeeded':
          console.log('[Webhook] Payment intent succeeded:', event.data.object.id);
          await this.paymentService.upsertPaymentFromIntent(event.data.object);
          break;

        case 'payment_intent.payment_failed':
          console.log('[Webhook] Payment intent failed:', event.data.object.id);
          await this.paymentService.upsertPaymentFromIntent(event.data.object);
          break;

        case 'payment_intent.processing':
          console.log('[Webhook] Payment intent processing:', event.data.object.id);
          await this.paymentService.upsertPaymentFromIntent(event.data.object);
          break;

        case 'payment_intent.canceled':
          console.log('[Webhook] Payment intent canceled:', event.data.object.id);
          await this.paymentService.upsertPaymentFromIntent(event.data.object);
          break;

        case 'payment_intent.created':
          console.log('[Webhook] Payment intent created:', event.data.object.id);
          await this.paymentService.upsertPaymentFromIntent(event.data.object);
          break;

        // ============================================
        // PAYMENT METHOD EVENTS
        // ============================================
        case 'payment_method.attached':
          console.log('[Webhook] Payment method attached:', event.data.object.id);
          await this.paymentService.upsertPaymentMethod(event.data.object);
          break;

        case 'payment_method.detached':
          console.log('[Webhook] Payment method detached:', event.data.object.id);
          await this.paymentService.removePaymentMethod(event.data.object.id);
          break;

        case 'payment_method.updated':
          console.log('[Webhook] Payment method updated:', event.data.object.id);
          await this.paymentService.upsertPaymentMethod(event.data.object);
          break;

        // ============================================
        // INVOICE EVENTS
        // ============================================
        case 'invoice.paid':
          console.log('[Webhook] Invoice paid:', event.data.object.id);
          await this.paymentService.updatePaymentFromInvoice(event.data.object);
          break;

        case 'invoice.payment_failed':
          console.log('[Webhook] Invoice payment failed:', event.data.object.id);
          await this.paymentService.updatePaymentFromInvoice(event.data.object);
          break;

        case 'invoice.payment_succeeded':
          console.log('[Webhook] Invoice payment succeeded:', event.data.object.id);
          await this.paymentService.updatePaymentFromInvoice(event.data.object);
          break;

        case 'invoice.created':
          console.log('[Webhook] Invoice created:', event.data.object.id);
          await this.paymentService.updatePaymentFromInvoice(event.data.object);
          break;

        case 'invoice.finalized':
          console.log('[Webhook] Invoice finalized:', event.data.object.id);
          await this.paymentService.updatePaymentFromInvoice(event.data.object);
          break;

        case 'invoice.voided':
          console.log('[Webhook] Invoice voided:', event.data.object.id);
          await this.paymentService.updatePaymentFromInvoice(event.data.object);
          break;

        // ============================================
        // CUSTOMER EVENTS
        // ============================================
        case 'customer.updated':
          console.log('[Webhook] Customer updated:', event.data.object.id);
          // Customer updates are handled separately if needed
          break;

        case 'customer.deleted':
          console.log('[Webhook] Customer deleted:', event.data.object.id);
          // Handle customer deletion if needed
          break;

        // ============================================
        // CHECKOUT SESSION EVENTS
        // ============================================
        case 'checkout.session.completed':
          console.log('[Webhook] Checkout session completed:', event.data.object.id);
          // If subscription was created, it will be handled by subscription.created event
          // If payment intent was created, it will be handled by payment_intent.succeeded event
          break;

        case 'checkout.session.expired':
          console.log('[Webhook] Checkout session expired:', event.data.object.id);
          break;

        default:
          console.log(`[Webhook] Unhandled event type: ${event.type}`);
      }
    } catch (error) {
      console.error(`[Webhook] Error processing ${event.type}:`, error);
      throw error;
    }
  }
}
