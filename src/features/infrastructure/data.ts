import type {
  InfraDetail,
  InfraMetrics,
  EcsMetrics,
  InfraType,
  ServiceProfileKey,
  ServicesInstance,
  StatusLevel,
} from "../../types/infrastructure";

const serviceSummaryByName: Record<string, string> = {
  // Core Business Services
  "payment-service": "Handles payment orchestration, fraud screening, and settlement workflows across all channels.",
  "order-service": "Coordinates order intake, validation, and downstream fulfillment events.",
  "inventory-sync": "Keeps stock levels in sync between regional warehouses and storefront availability caches.",
  "reporting-service": "Generates compliance and KPI dashboards for executive stakeholders.",
  
  // Customer Services
  "customer-profile-service": "Manages customer profiles, preferences, and segmentation data with GDPR compliance.",
  "customer-auth-service": "Provides OAuth2/JWT authentication and authorization for customer-facing applications.",
  "customer-notification-service": "Handles email, SMS, and push notifications with delivery tracking and preferences.",
  "customer-loyalty-service": "Manages loyalty points, rewards, and tier-based benefits for customer retention.",
  "customer-support-service": "Ticketing system for customer service interactions with SLA tracking.",
  
  // Product Services
  "product-catalog-service": "Centralized product information management with multi-language support.",
  "product-pricing-service": "Dynamic pricing engine with promotional rules and regional adjustments.",
  "product-recommendation-service": "ML-powered recommendation engine for personalized product suggestions.",
  "product-search-service": "Elasticsearch-based product search with faceting and autocomplete.",
  "product-review-service": "Customer review and rating system with moderation workflows.",
  
  // Commerce Services
  "shopping-cart-service": "Shopping cart management with persistence and synchronization across devices.",
  "checkout-service": "Secure checkout process with multiple payment methods and tax calculations.",
  "promotion-service": "Promotional campaign management with discount rules and coupon validation.",
  "shipping-service": "Shipping cost calculation and carrier integration for delivery tracking.",
  "tax-service": "Tax calculation engine with jurisdiction-specific rules and compliance.",
  
  // Financial Services
  "accounting-service": "General ledger and financial transaction processing for compliance.",
  "invoice-service": "Invoice generation, processing, and accounts receivable management.",
  "refund-service": "Refund processing workflow with approval chains and payment reversals.",
  "fraud-detection-service": "Real-time fraud detection using ML models and rule engines.",
  "financial-reporting-service": "Financial analytics and regulatory reporting for audits.",
  
  // Operational Services
  "warehouse-management-service": "WMS integration for inventory allocation and fulfillment operations.",
  "supplier-service": "Supplier relationship management with contract and performance tracking.",
  "procurement-service": "Purchase order management and supplier catalog integration.",
  "quality-assurance-service": "Product quality tracking and defect management workflows.",
  "return-service": "Return merchandise authorization and reverse logistics processing.",
  
  // Analytics & Intelligence
  "analytics-service": "Real-time analytics processing for business intelligence dashboards.",
  "data-pipeline-service": "ETL pipelines for data warehousing and reporting infrastructure.",
  "ml-model-service": "Machine learning model serving for personalization and predictions.",
  "audit-service": "Audit trail management for compliance and security monitoring.",
  "monitoring-service": "Application performance monitoring and alerting infrastructure.",
  
  // Integration Services
  "api-gateway-service": "Central API gateway for request routing, authentication, and rate limiting.",
  "message-queue-service": "Event-driven messaging infrastructure using Apache Kafka.",
  "file-storage-service": "Document and media file storage with CDN integration.",
  "email-service": "Transactional email delivery with template management and tracking.",
  "sms-service": "SMS delivery service with carrier optimization and delivery receipts.",
  
  // Infrastructure Services
  "config-service": "Centralized configuration management with environment-specific settings.",
  "discovery-service": "Service registry and discovery using Netflix Eureka.",
  "circuit-breaker-service": "Circuit breaker pattern implementation for resilience.",
  "caching-service": "Distributed caching layer using Redis for performance optimization.",
  "database-migration-service": "Database schema migration and versioning management.",
  
  // Security Services
  "security-service": "Centralized security policy enforcement and threat detection.",
  "encryption-service": "Data encryption and key management service for PCI compliance.",
  "token-service": "JWT token generation and validation for microservices authentication.",
  "permission-service": "Role-based access control and permission management.",
  "audit-log-service": "Security audit logging with tamper-proof event recording.",
  
  // Content & Media Services
  "content-management-service": "CMS for managing web content, pages, and digital assets.",
  "image-processing-service": "Image resizing, optimization, and format conversion service.",
  "video-streaming-service": "Video content delivery and streaming infrastructure.",
  "document-service": "Document generation and PDF processing capabilities.",
  "translation-service": "Multi-language translation service with caching and quality control.",
  
  // Additional Specialized Services
  "geolocation-service": "Address validation, geocoding, and location-based services.",
  "weather-service": "Weather data integration for logistics and seasonal recommendations.",
  "calendar-service": "Appointment scheduling and calendar integration service.",
  "notification-preference-service": "User notification preferences and delivery optimization.",
  "session-management-service": "User session management with cross-device synchronization.",
  "rate-limiting-service": "API rate limiting and throttling service for fair usage.",
  "backup-service": "Automated backup and disaster recovery service management.",
  "log-aggregation-service": "Centralized logging with search and alerting capabilities."
};

function toMinutes(seconds: number): number {
  return Math.max(0, Math.round(seconds / 60));
}

export function formatUpdatedTime(minutes: number): string {
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const remainder = minutes % 60;
    if (remainder === 0) return `${hours}h ago`;
    return `${hours}h ${remainder}m ago`;
  }
  return `${minutes}m ago`;
}

export function formatUptime(minutes: number): string {
  if (minutes >= 1440) {
    const days = Math.floor(minutes / 1440);
    const remainder = minutes % 1440;
    const hours = Math.floor(remainder / 60);
    if (hours === 0) return `${days}d`;
    return `${days}d ${hours}h`;
  }
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const remMinutes = minutes % 60;
    if (remMinutes === 0) return `${hours}h`;
    return `${hours}h ${remMinutes}m`;
  }
  return `${minutes}m`;
}

function determineStatus(usage: number, limit: number): StatusLevel {
  const ratio = limit > 0 ? usage / limit : 0;
  if (ratio < 0.55) return "healthy";
  if (ratio < 0.8) return "watch";
  return "scaling";
}

type RawServiceInstance = {
  id: string;
  serviceName: string;
  machineName: string;
  infraType: InfraType;
  profile: ServiceProfileKey;
  version: string;
  logURL: string;
  metricsURL: string;
  port: number;
  uptimeSeconds: number;
  status?: "running" | "degraded" | "restarting";
};

const rawServiceInstances: RawServiceInstance[] = [
  // APAC QA Environment Services
  { id: "svc-3001", serviceName: "payment-service", machineName: "apacqa-vm1", infraType: "linux", profile: "apacqa", version: "1.2.3", logURL: "https://logs.example.com/apacqa/payment-service", metricsURL: "https://metrics.example.com/apacqa/payment-service", port: 8080, uptimeSeconds: 14400, status: "running" },
  { id: "svc-3002", serviceName: "payment-service", machineName: "apacqa-vm2", infraType: "linux", profile: "apacqa", version: "1.2.3", logURL: "https://logs.example.com/apacqa/payment-service", metricsURL: "https://metrics.example.com/apacqa/payment-service", port: 8080, uptimeSeconds: 12600, status: "running" },
  { id: "svc-3003", serviceName: "order-service", machineName: "apacqa-vm1", infraType: "linux", profile: "apacqa", version: "2.1.0", logURL: "https://logs.example.com/apacqa/order-service", metricsURL: "https://metrics.example.com/apacqa/order-service", port: 8081, uptimeSeconds: 18000, status: "running" },
  { id: "svc-3004", serviceName: "order-service", machineName: "apacqa-vm3", infraType: "linux", profile: "apacqa", version: "2.1.0", logURL: "https://logs.example.com/apacqa/order-service", metricsURL: "https://metrics.example.com/apacqa/order-service", port: 8081, uptimeSeconds: 7200, status: "degraded" },
  { id: "svc-3005", serviceName: "customer-profile-service", machineName: "apacqa-vm2", infraType: "linux", profile: "apacqa", version: "1.5.2", logURL: "https://logs.example.com/apacqa/customer-profile-service", metricsURL: "https://metrics.example.com/apacqa/customer-profile-service", port: 8082, uptimeSeconds: 25200, status: "running" },
  { id: "svc-3006", serviceName: "customer-auth-service", machineName: "apacqa-vm1", infraType: "linux", profile: "apacqa", version: "3.0.1", logURL: "https://logs.example.com/apacqa/customer-auth-service", metricsURL: "https://metrics.example.com/apacqa/customer-auth-service", port: 8083, uptimeSeconds: 10800, status: "running" },
  { id: "svc-3007", serviceName: "inventory-sync", machineName: "apacqa-vm3", infraType: "linux", profile: "apacqa", version: "1.8.0", logURL: "https://logs.example.com/apacqa/inventory-sync", metricsURL: "https://metrics.example.com/apacqa/inventory-sync", port: 8084, uptimeSeconds: 16200, status: "running" },
  { id: "svc-3008", serviceName: "product-catalog-service", machineName: "apacqa-vm2", infraType: "linux", profile: "apacqa", version: "2.3.1", logURL: "https://logs.example.com/apacqa/product-catalog-service", metricsURL: "https://metrics.example.com/apacqa/product-catalog-service", port: 8085, uptimeSeconds: 19800, status: "running" },
  { id: "svc-3009", serviceName: "shopping-cart-service", machineName: "apacqa-vm1", infraType: "linux", profile: "apacqa", version: "1.4.3", logURL: "https://logs.example.com/apacqa/shopping-cart-service", metricsURL: "https://metrics.example.com/apacqa/shopping-cart-service", port: 8086, uptimeSeconds: 14400, status: "restarting" },
  { id: "svc-3010", serviceName: "customer-notification-service", machineName: "apacqa-vm3", infraType: "linux", profile: "apacqa", version: "1.1.2", logURL: "https://logs.example.com/apacqa/customer-notification-service", metricsURL: "https://metrics.example.com/apacqa/customer-notification-service", port: 8087, uptimeSeconds: 21600, status: "running" },
  { id: "svc-3011", serviceName: "analytics-service", machineName: "apacqa-vm1", infraType: "linux", profile: "apacqa", version: "1.7.0", logURL: "https://logs.example.com/apacqa/analytics-service", metricsURL: "https://metrics.example.com/apacqa/analytics-service", port: 8088, uptimeSeconds: 28800, status: "running" },
  { id: "svc-3012", serviceName: "api-gateway-service", machineName: "apacqa-vm2", infraType: "linux", profile: "apacqa", version: "2.0.0", logURL: "https://logs.example.com/apacqa/api-gateway-service", metricsURL: "https://metrics.example.com/apacqa/api-gateway-service", port: 8089, uptimeSeconds: 32400, status: "running" },
  { id: "svc-3013", serviceName: "config-service", machineName: "apacqa-vm3", infraType: "linux", profile: "apacqa", version: "1.0.5", logURL: "https://logs.example.com/apacqa/config-service", metricsURL: "https://metrics.example.com/apacqa/config-service", port: 8090, uptimeSeconds: 36000, status: "running" },
  { id: "svc-3014", serviceName: "product-pricing-service", machineName: "apacqa-vm1", infraType: "linux", profile: "apacqa", version: "1.2.1", logURL: "https://logs.example.com/apacqa/product-pricing-service", metricsURL: "https://metrics.example.com/apacqa/product-pricing-service", port: 8092, uptimeSeconds: 18000, status: "degraded" },
  { id: "svc-3015", serviceName: "checkout-service", machineName: "apacqa-vm2", infraType: "linux", profile: "apacqa", version: "2.0.2", logURL: "https://logs.example.com/apacqa/checkout-service", metricsURL: "https://metrics.example.com/apacqa/checkout-service", port: 8093, uptimeSeconds: 14400, status: "running" },

  // APAC UAT Environment Services  
  { id: "svc-3101", serviceName: "payment-service", machineName: "apacuat-vm1", infraType: "linux", profile: "apacuat", version: "1.2.4", logURL: "https://logs.example.com/apacuat/payment-service", metricsURL: "https://metrics.example.com/apacuat/payment-service", port: 8080, uptimeSeconds: 43200, status: "running" },
  { id: "svc-3102", serviceName: "order-service", machineName: "apacuat-vm2", infraType: "linux", profile: "apacuat", version: "2.1.1", logURL: "https://logs.example.com/apacuat/order-service", metricsURL: "https://metrics.example.com/apacuat/order-service", port: 8081, uptimeSeconds: 39600, status: "running" },
  { id: "svc-3103", serviceName: "customer-profile-service", machineName: "apacuat-vm1", infraType: "linux", profile: "apacuat", version: "1.5.3", logURL: "https://logs.example.com/apacuat/customer-profile-service", metricsURL: "https://metrics.example.com/apacuat/customer-profile-service", port: 8082, uptimeSeconds: 50400, status: "running" },
  { id: "svc-3104", serviceName: "inventory-sync", machineName: "apacuat-vm3", infraType: "linux", profile: "apacuat", version: "1.8.1", logURL: "https://logs.example.com/apacuat/inventory-sync", metricsURL: "https://metrics.example.com/apacuat/inventory-sync", port: 8084, uptimeSeconds: 32400, status: "running" },
  { id: "svc-3105", serviceName: "reporting-service", machineName: "apacuat-vm2", infraType: "linux", profile: "apacuat", version: "1.3.0", logURL: "https://logs.example.com/apacuat/reporting-service", metricsURL: "https://metrics.example.com/apacuat/reporting-service", port: 8091, uptimeSeconds: 64800, status: "running" },
  { id: "svc-3106", serviceName: "customer-loyalty-service", machineName: "apacuat-vm1", infraType: "linux", profile: "apacuat", version: "1.0.8", logURL: "https://logs.example.com/apacuat/customer-loyalty-service", metricsURL: "https://metrics.example.com/apacuat/customer-loyalty-service", port: 8098, uptimeSeconds: 28800, status: "degraded" },
  { id: "svc-3107", serviceName: "product-recommendation-service", machineName: "apacuat-vm3", infraType: "linux", profile: "apacuat", version: "2.5.0", logURL: "https://logs.example.com/apacuat/product-recommendation-service", metricsURL: "https://metrics.example.com/apacuat/product-recommendation-service", port: 8099, uptimeSeconds: 18000, status: "running" },
  { id: "svc-3108", serviceName: "fraud-detection-service", machineName: "apacuat-vm2", infraType: "linux", profile: "apacuat", version: "3.1.0", logURL: "https://logs.example.com/apacuat/fraud-detection-service", metricsURL: "https://metrics.example.com/apacuat/fraud-detection-service", port: 8094, uptimeSeconds: 25200, status: "running" },
  { id: "svc-3109", serviceName: "warehouse-management-service", machineName: "apacuat-vm1", infraType: "linux", profile: "apacuat", version: "1.6.0", logURL: "https://logs.example.com/apacuat/warehouse-management-service", metricsURL: "https://metrics.example.com/apacuat/warehouse-management-service", port: 8095, uptimeSeconds: 36000, status: "running" },
  { id: "svc-3110", serviceName: "data-pipeline-service", machineName: "apacuat-vm3", infraType: "linux", profile: "apacuat", version: "2.2.0", logURL: "https://logs.example.com/apacuat/data-pipeline-service", metricsURL: "https://metrics.example.com/apacuat/data-pipeline-service", port: 8096, uptimeSeconds: 21600, status: "running" },
  { id: "svc-3111", serviceName: "security-service", machineName: "apacuat-vm2", infraType: "linux", profile: "apacuat", version: "1.9.1", logURL: "https://logs.example.com/apacuat/security-service", metricsURL: "https://metrics.example.com/apacuat/security-service", port: 8097, uptimeSeconds: 46800, status: "running" },
  { id: "svc-3112", serviceName: "promotion-service", machineName: "apacuat-vm1", infraType: "linux", profile: "apacuat", version: "1.4.2", logURL: "https://logs.example.com/apacuat/promotion-service", metricsURL: "https://metrics.example.com/apacuat/promotion-service", port: 8100, uptimeSeconds: 32400, status: "running" },
  { id: "svc-3113", serviceName: "shipping-service", machineName: "apacuat-vm3", infraType: "linux", profile: "apacuat", version: "1.7.3", logURL: "https://logs.example.com/apacuat/shipping-service", metricsURL: "https://metrics.example.com/apacuat/shipping-service", port: 8101, uptimeSeconds: 28800, status: "running" },

  // EMEA QA Environment Services
  { id: "svc-4001", serviceName: "payment-service", machineName: "emeaqa-vm1", infraType: "windows", profile: "emeaqa", version: "1.2.3", logURL: "https://logs.example.com/emeaqa/payment-service", metricsURL: "https://metrics.example.com/emeaqa/payment-service", port: 8080, uptimeSeconds: 86400, status: "running" },
  { id: "svc-4002", serviceName: "order-service", machineName: "emeaqa-vm2", infraType: "windows", profile: "emeaqa", version: "2.1.0", logURL: "https://logs.example.com/emeaqa/order-service", metricsURL: "https://metrics.example.com/emeaqa/order-service", port: 8081, uptimeSeconds: 72000, status: "running" },
  { id: "svc-4003", serviceName: "tax-service", machineName: "emeaqa-vm1", infraType: "windows", profile: "emeaqa", version: "2.0.1", logURL: "https://logs.example.com/emeaqa/tax-service", metricsURL: "https://metrics.example.com/emeaqa/tax-service", port: 8102, uptimeSeconds: 57600, status: "running" },
  { id: "svc-4004", serviceName: "accounting-service", machineName: "emeaqa-vm3", infraType: "windows", profile: "emeaqa", version: "3.2.0", logURL: "https://logs.example.com/emeaqa/accounting-service", metricsURL: "https://metrics.example.com/emeaqa/accounting-service", port: 8103, uptimeSeconds: 61200, status: "running" },
  { id: "svc-4005", serviceName: "invoice-service", machineName: "emeaqa-vm2", infraType: "windows", profile: "emeaqa", version: "1.8.5", logURL: "https://logs.example.com/emeaqa/invoice-service", metricsURL: "https://metrics.example.com/emeaqa/invoice-service", port: 8104, uptimeSeconds: 14400, status: "restarting" },
  { id: "svc-4006", serviceName: "refund-service", machineName: "emeaqa-vm1", infraType: "windows", profile: "emeaqa", version: "1.3.2", logURL: "https://logs.example.com/emeaqa/refund-service", metricsURL: "https://metrics.example.com/emeaqa/refund-service", port: 8105, uptimeSeconds: 39600, status: "running" },
  { id: "svc-4007", serviceName: "ml-model-service", machineName: "emeaqa-vm3", infraType: "windows", profile: "emeaqa", version: "2.1.3", logURL: "https://logs.example.com/emeaqa/ml-model-service", metricsURL: "https://metrics.example.com/emeaqa/ml-model-service", port: 8106, uptimeSeconds: 46800, status: "running" },
  { id: "svc-4008", serviceName: "message-queue-service", machineName: "emeaqa-vm2", infraType: "windows", profile: "emeaqa", version: "1.5.0", logURL: "https://logs.example.com/emeaqa/message-queue-service", metricsURL: "https://metrics.example.com/emeaqa/message-queue-service", port: 8107, uptimeSeconds: 32400, status: "running" },
  { id: "svc-4009", serviceName: "customer-support-service", machineName: "emeaqa-vm1", infraType: "windows", profile: "emeaqa", version: "1.9.0", logURL: "https://logs.example.com/emeaqa/customer-support-service", metricsURL: "https://metrics.example.com/emeaqa/customer-support-service", port: 8137, uptimeSeconds: 25200, status: "degraded" },
  { id: "svc-4010", serviceName: "product-search-service", machineName: "emeaqa-vm3", infraType: "windows", profile: "emeaqa", version: "3.0.2", logURL: "https://logs.example.com/emeaqa/product-search-service", metricsURL: "https://metrics.example.com/emeaqa/product-search-service", port: 8108, uptimeSeconds: 18000, status: "running" },
  { id: "svc-4011", serviceName: "product-review-service", machineName: "emeaqa-vm2", infraType: "windows", profile: "emeaqa", version: "1.6.1", logURL: "https://logs.example.com/emeaqa/product-review-service", metricsURL: "https://metrics.example.com/emeaqa/product-review-service", port: 8109, uptimeSeconds: 43200, status: "running" },
  { id: "svc-4012", serviceName: "supplier-service", machineName: "emeaqa-vm1", infraType: "windows", profile: "emeaqa", version: "2.3.0", logURL: "https://logs.example.com/emeaqa/supplier-service", metricsURL: "https://metrics.example.com/emeaqa/supplier-service", port: 8110, uptimeSeconds: 79200, status: "running" },

  // EMEA UAT Environment Services
  { id: "svc-4101", serviceName: "payment-service", machineName: "emeauat-vm1", infraType: "windows", profile: "emeauat", version: "1.2.4", logURL: "https://logs.example.com/emeauat/payment-service", metricsURL: "https://metrics.example.com/emeauat/payment-service", port: 8080, uptimeSeconds: 129600, status: "running" },
  { id: "svc-4102", serviceName: "order-service", machineName: "emeauat-vm2", infraType: "windows", profile: "emeauat", version: "2.1.1", logURL: "https://logs.example.com/emeauat/order-service", metricsURL: "https://metrics.example.com/emeauat/order-service", port: 8081, uptimeSeconds: 108000, status: "running" },
  { id: "svc-4103", serviceName: "procurement-service", machineName: "emeauat-vm3", infraType: "windows", profile: "emeauat", version: "1.9.2", logURL: "https://logs.example.com/emeauat/procurement-service", metricsURL: "https://metrics.example.com/emeauat/procurement-service", port: 8111, uptimeSeconds: 93600, status: "running" },
  { id: "svc-4104", serviceName: "quality-assurance-service", machineName: "emeauat-vm1", infraType: "windows", profile: "emeauat", version: "1.2.7", logURL: "https://logs.example.com/emeauat/quality-assurance-service", metricsURL: "https://metrics.example.com/emeauat/quality-assurance-service", port: 8112, uptimeSeconds: 86400, status: "running" },
  { id: "svc-4105", serviceName: "return-service", machineName: "emeauat-vm2", infraType: "windows", profile: "emeauat", version: "2.0.3", logURL: "https://logs.example.com/emeauat/return-service", metricsURL: "https://metrics.example.com/emeauat/return-service", port: 8113, uptimeSeconds: 72000, status: "running" },
  { id: "svc-4106", serviceName: "file-storage-service", machineName: "emeauat-vm3", infraType: "windows", profile: "emeauat", version: "1.4.5", logURL: "https://logs.example.com/emeauat/file-storage-service", metricsURL: "https://metrics.example.com/emeauat/file-storage-service", port: 8114, uptimeSeconds: 57600, status: "degraded" },
  { id: "svc-4107", serviceName: "email-service", machineName: "emeauat-vm1", infraType: "windows", profile: "emeauat", version: "2.1.0", logURL: "https://logs.example.com/emeauat/email-service", metricsURL: "https://metrics.example.com/emeauat/email-service", port: 8115, uptimeSeconds: 64800, status: "running" },
  { id: "svc-4108", serviceName: "sms-service", machineName: "emeauat-vm2", infraType: "windows", profile: "emeauat", version: "1.7.1", logURL: "https://logs.example.com/emeauat/sms-service", metricsURL: "https://metrics.example.com/emeauat/sms-service", port: 8116, uptimeSeconds: 46800, status: "running" },
  { id: "svc-4109", serviceName: "discovery-service", machineName: "emeauat-vm3", infraType: "windows", profile: "emeauat", version: "1.0.12", logURL: "https://logs.example.com/emeauat/discovery-service", metricsURL: "https://metrics.example.com/emeauat/discovery-service", port: 8761, uptimeSeconds: 36000, status: "running" },
  { id: "svc-4110", serviceName: "circuit-breaker-service", machineName: "emeauat-vm1", infraType: "windows", profile: "emeauat", version: "2.4.1", logURL: "https://logs.example.com/emeauat/circuit-breaker-service", metricsURL: "https://metrics.example.com/emeauat/circuit-breaker-service", port: 8117, uptimeSeconds: 82800, status: "running" },
  { id: "svc-4111", serviceName: "caching-service", machineName: "emeauat-vm2", infraType: "windows", profile: "emeauat", version: "1.8.3", logURL: "https://logs.example.com/emeauat/caching-service", metricsURL: "https://metrics.example.com/emeauat/caching-service", port: 8118, uptimeSeconds: 28800, status: "running" },

  // NAM QA Environment Services
  { id: "svc-5001", serviceName: "payment-service", machineName: "namqa-task1", infraType: "ecs", profile: "namqa", version: "1.2.3", logURL: "https://logs.example.com/namqa/payment-service", metricsURL: "https://metrics.example.com/namqa/payment-service", port: 8080, uptimeSeconds: 172800, status: "running" },
  { id: "svc-5002", serviceName: "order-service", machineName: "namqa-task2", infraType: "ecs", profile: "namqa", version: "2.1.0", logURL: "https://logs.example.com/namqa/order-service", metricsURL: "https://metrics.example.com/namqa/order-service", port: 8081, uptimeSeconds: 144000, status: "running" },
  { id: "svc-5003", serviceName: "database-migration-service", machineName: "namqa-task1", infraType: "ecs", profile: "namqa", version: "1.3.4", logURL: "https://logs.example.com/namqa/database-migration-service", metricsURL: "https://metrics.example.com/namqa/database-migration-service", port: 8119, uptimeSeconds: 259200, status: "running" },
  { id: "svc-5004", serviceName: "encryption-service", machineName: "namqa-task3", infraType: "ecs", profile: "namqa", version: "3.1.2", logURL: "https://logs.example.com/namqa/encryption-service", metricsURL: "https://metrics.example.com/namqa/encryption-service", port: 8120, uptimeSeconds: 86400, status: "running" },
  { id: "svc-5005", serviceName: "token-service", machineName: "namqa-task2", infraType: "ecs", profile: "namqa", version: "2.0.5", logURL: "https://logs.example.com/namqa/token-service", metricsURL: "https://metrics.example.com/namqa/token-service", port: 8121, uptimeSeconds: 93600, status: "running" },
  { id: "svc-5006", serviceName: "permission-service", machineName: "namqa-task1", infraType: "ecs", profile: "namqa", version: "1.5.7", logURL: "https://logs.example.com/namqa/permission-service", metricsURL: "https://metrics.example.com/namqa/permission-service", port: 8122, uptimeSeconds: 21600, status: "restarting" },
  { id: "svc-5007", serviceName: "audit-log-service", machineName: "namqa-task3", infraType: "ecs", profile: "namqa", version: "2.2.1", logURL: "https://logs.example.com/namqa/audit-log-service", metricsURL: "https://metrics.example.com/namqa/audit-log-service", port: 8123, uptimeSeconds: 115200, status: "running" },
  { id: "svc-5008", serviceName: "content-management-service", machineName: "namqa-task2", infraType: "ecs", profile: "namqa", version: "1.6.3", logURL: "https://logs.example.com/namqa/content-management-service", metricsURL: "https://metrics.example.com/namqa/content-management-service", port: 8124, uptimeSeconds: 129600, status: "running" },
  { id: "svc-5009", serviceName: "image-processing-service", machineName: "namqa-task1", infraType: "ecs", profile: "namqa", version: "2.3.0", logURL: "https://logs.example.com/namqa/image-processing-service", metricsURL: "https://metrics.example.com/namqa/image-processing-service", port: 8125, uptimeSeconds: 64800, status: "degraded" },
  { id: "svc-5010", serviceName: "audit-service", machineName: "namqa-task3", infraType: "ecs", profile: "namqa", version: "1.4.3", logURL: "https://logs.example.com/namqa/audit-service", metricsURL: "https://metrics.example.com/namqa/audit-service", port: 8138, uptimeSeconds: 201600, status: "running" },
  { id: "svc-5011", serviceName: "monitoring-service", machineName: "namqa-task2", infraType: "ecs", profile: "namqa", version: "2.8.1", logURL: "https://logs.example.com/namqa/monitoring-service", metricsURL: "https://metrics.example.com/namqa/monitoring-service", port: 8139, uptimeSeconds: 46800, status: "running" },
  { id: "svc-5012", serviceName: "video-streaming-service", machineName: "namqa-task1", infraType: "ecs", profile: "namqa", version: "1.9.0", logURL: "https://logs.example.com/namqa/video-streaming-service", metricsURL: "https://metrics.example.com/namqa/video-streaming-service", port: 8126, uptimeSeconds: 79200, status: "running" },

  // NAM UAT Environment Services  
  { id: "svc-5101", serviceName: "payment-service", machineName: "namuat-task1", infraType: "ecs", profile: "namuat", version: "1.2.4", logURL: "https://logs.example.com/namuat/payment-service", metricsURL: "https://metrics.example.com/namuat/payment-service", port: 8080, uptimeSeconds: 302400, status: "running" },
  { id: "svc-5102", serviceName: "order-service", machineName: "namuat-task2", infraType: "ecs", profile: "namuat", version: "2.1.1", logURL: "https://logs.example.com/namuat/order-service", metricsURL: "https://metrics.example.com/namuat/order-service", port: 8081, uptimeSeconds: 288000, status: "running" },
  { id: "svc-5103", serviceName: "document-service", machineName: "namuat-task3", infraType: "ecs", profile: "namuat", version: "1.4.8", logURL: "https://logs.example.com/namuat/document-service", metricsURL: "https://metrics.example.com/namuat/document-service", port: 8127, uptimeSeconds: 216000, status: "running" },
  { id: "svc-5104", serviceName: "translation-service", machineName: "namuat-task1", infraType: "ecs", profile: "namuat", version: "2.0.6", logURL: "https://logs.example.com/namuat/translation-service", metricsURL: "https://metrics.example.com/namuat/translation-service", port: 8128, uptimeSeconds: 172800, status: "running" },
  { id: "svc-5105", serviceName: "geolocation-service", machineName: "namuat-task2", infraType: "ecs", profile: "namuat", version: "1.7.2", logURL: "https://logs.example.com/namuat/geolocation-service", metricsURL: "https://metrics.example.com/namuat/geolocation-service", port: 8129, uptimeSeconds: 158400, status: "running" },
  { id: "svc-5106", serviceName: "weather-service", machineName: "namuat-task3", infraType: "ecs", profile: "namuat", version: "1.2.5", logURL: "https://logs.example.com/namuat/weather-service", metricsURL: "https://metrics.example.com/namuat/weather-service", port: 8130, uptimeSeconds: 93600, status: "degraded" },
  { id: "svc-5107", serviceName: "calendar-service", machineName: "namuat-task1", infraType: "ecs", profile: "namuat", version: "1.5.1", logURL: "https://logs.example.com/namuat/calendar-service", metricsURL: "https://metrics.example.com/namuat/calendar-service", port: 8131, uptimeSeconds: 122400, status: "running" },
  { id: "svc-5108", serviceName: "notification-preference-service", machineName: "namuat-task2", infraType: "ecs", profile: "namuat", version: "1.1.9", logURL: "https://logs.example.com/namuat/notification-preference-service", metricsURL: "https://metrics.example.com/namuat/notification-preference-service", port: 8132,uptimeSeconds: 104400, status: "running" },
  { id: "svc-5109", serviceName: "session-management-service", machineName: "namuat-task3", infraType: "ecs", profile: "namuat", version: "2.1.3", logURL: "https://logs.example.com/namuat/session-management-service", metricsURL: "https://metrics.example.com/namuat/session-management-service", port: 8133, uptimeSeconds: 86400, status: "running" },
  { id: "svc-5110", serviceName: "rate-limiting-service", machineName: "namuat-task1", infraType: "ecs", profile: "namuat", version: "1.8.0", logURL: "https://logs.example.com/namuat/rate-limiting-service", metricsURL: "https://metrics.example.com/namuat/rate-limiting-service", port: 8134, uptimeSeconds: 201600, status: "running" },
  { id: "svc-5111", serviceName: "backup-service", machineName: "namuat-task2", infraType: "ecs", profile: "namuat", version: "3.0.1", logURL: "https://logs.example.com/namuat/backup-service", metricsURL: "https://metrics.example.com/namuat/backup-service", port: 8135, uptimeSeconds: 144000, status: "running" },
  { id: "svc-5112", serviceName: "log-aggregation-service", machineName: "namuat-task3", infraType: "ecs", profile: "namuat", version: "2.4.2", logURL: "https://logs.example.com/namuat/log-aggregation-service", metricsURL: "https://metrics.example.com/namuat/log-aggregation-service", port: 8136, uptimeSeconds: 259200, status: "running" },
  { id: "svc-5113", serviceName: "financial-reporting-service", machineName: "namuat-task1", infraType: "ecs", profile: "namuat", version: "1.5.3", logURL: "https://logs.example.com/namuat/financial-reporting-service", metricsURL: "https://metrics.example.com/namuat/financial-reporting-service", port: 8140, uptimeSeconds: 180000, status: "running" }
];

export const ServicesInstances: ServicesInstance[] = rawServiceInstances.map((instance) => ({
  id: instance.id,
  serviceName: instance.serviceName,
  machineName: instance.machineName,
  Port: instance.port,
  infraType: instance.infraType,
  profile: instance.profile,
  uptime: toMinutes(instance.uptimeSeconds),
  version: instance.version,
  logURL: instance.logURL,
  metricsURL: instance.metricsURL,
  status: instance.status,
}));

const serviceInstanceById = new Map(ServicesInstances.map((instance) => [instance.id, instance]));

type RawInfraDetail = {
  id: string;
  machineName: string;
  infraType: InfraType;
  region: "APAC" | "NAM" | "EMEA";
  environment: "DEV" | "UAT" | "PROD" | "COB";
  datacenter: string;
  metrics: InfraMetrics | EcsMetrics;
  sericesInstances: string[];
};

const rawInfraDetails: RawInfraDetail[] = [
  {
    id: "apacqa-vm1",
    machineName: "apacqa-vm1",
    infraType: "linux",
    region: "APAC",
    environment: "UAT",
    datacenter: "ap-southeast-1a",
    metrics: {
      cpu: { usage: 2.4, limit: 4, unit: "vCPU" },
      memory: { usage: 8.1, limit: 16, unit: "GiB" },
    },
    sericesInstances: ["svc-3001", "svc-3003", "svc-3006", "svc-3009", "svc-3011"],
  },
  {
    id: "apacqa-vm2",
    machineName: "apacqa-vm2",
    infraType: "linux",
    region: "APAC",
    environment: "UAT",
    datacenter: "ap-southeast-1b",
    metrics: {
      cpu: { usage: 2.9, limit: 4, unit: "vCPU" },
      memory: { usage: 9.6, limit: 16, unit: "GiB" },
    },
    sericesInstances: ["svc-3002", "svc-3005", "svc-3008", "svc-3012", "svc-3015"],
  },
  {
    id: "apacqa-vm3",
    machineName: "apacqa-vm3",
    infraType: "linux",
    region: "APAC",
    environment: "UAT",
    datacenter: "ap-southeast-1c",
    metrics: {
      cpu: { usage: 1.8, limit: 4, unit: "vCPU" },
      memory: { usage: 7.2, limit: 16, unit: "GiB" },
    },
    sericesInstances: ["svc-3004", "svc-3007", "svc-3010", "svc-3013", "svc-3014"],
  },
  {
    id: "apacuat-vm1",
    machineName: "apacuat-vm1",
    infraType: "linux",
    region: "APAC",
    environment: "UAT",
    datacenter: "ap-southeast-1d",
    metrics: {
      cpu: { usage: 3.1, limit: 8, unit: "vCPU" },
      memory: { usage: 12.4, limit: 24, unit: "GiB" },
    },
    sericesInstances: ["svc-3101", "svc-3103", "svc-3106", "svc-3109", "svc-3112"],
  },
  {
    id: "apacuat-vm2",
    machineName: "apacuat-vm2",
    infraType: "linux",
    region: "APAC",
    environment: "UAT",
    datacenter: "ap-southeast-1e",
    metrics: {
      cpu: { usage: 2.7, limit: 8, unit: "vCPU" },
      memory: { usage: 14.1, limit: 24, unit: "GiB" },
    },
    sericesInstances: ["svc-3102", "svc-3105", "svc-3108", "svc-3111"],
  },
  {
    id: "apacuat-vm3",
    machineName: "apacuat-vm3",
    infraType: "linux",
    region: "APAC",
    environment: "UAT",
    datacenter: "ap-southeast-1f",
    metrics: {
      cpu: { usage: 2.2, limit: 8, unit: "vCPU" },
      memory: { usage: 9.8, limit: 24, unit: "GiB" },
    },
    sericesInstances: ["svc-3104", "svc-3107", "svc-3110", "svc-3113"],
  },
  {
    id: "emeaqa-vm1",
    machineName: "emeaqa-vm1",
    infraType: "windows",
    region: "EMEA",
    environment: "PROD",
    datacenter: "eu-west-1a",
    metrics: {
      cpu: { usage: 5.1, limit: 8, unit: "vCPU" },
      memory: { usage: 18.2, limit: 32, unit: "GiB" },
    },
    sericesInstances: ["svc-4001", "svc-4003", "svc-4006", "svc-4009", "svc-4012"],
  },
  {
    id: "emeaqa-vm2",
    machineName: "emeaqa-vm2",
    infraType: "windows",
    region: "EMEA",
    environment: "PROD",
    datacenter: "eu-west-1b",
    metrics: {
      cpu: { usage: 4.4, limit: 8, unit: "vCPU" },
      memory: { usage: 16.3, limit: 32, unit: "GiB" },
    },
    sericesInstances: ["svc-4002", "svc-4005", "svc-4008", "svc-4011"],
  },
  {
    id: "emeaqa-vm3",
    machineName: "emeaqa-vm3",
    infraType: "windows",
    region: "EMEA",
    environment: "PROD",
    datacenter: "eu-west-1c",
    metrics: {
      cpu: { usage: 3.8, limit: 8, unit: "vCPU" },
      memory: { usage: 14.7, limit: 32, unit: "GiB" },
    },
    sericesInstances: ["svc-4004", "svc-4007", "svc-4010"],
  },
  {
    id: "emeauat-vm1",
    machineName: "emeauat-vm1",
    infraType: "windows",
    region: "EMEA",
    environment: "UAT",
    datacenter: "eu-west-1d",
    metrics: {
      cpu: { usage: 6.2, limit: 16, unit: "vCPU" },
      memory: { usage: 24.8, limit: 48, unit: "GiB" },
    },
    sericesInstances: ["svc-4101", "svc-4104", "svc-4107", "svc-4110"],
  },
  {
    id: "emeauat-vm2",
    machineName: "emeauat-vm2",
    infraType: "windows",
    region: "EMEA",
    environment: "UAT",
    datacenter: "eu-west-1e",
    metrics: {
      cpu: { usage: 5.7, limit: 16, unit: "vCPU" },
      memory: { usage: 22.3, limit: 48, unit: "GiB" },
    },
    sericesInstances: ["svc-4102", "svc-4105", "svc-4108", "svc-4111"],
  },
  {
    id: "emeauat-vm3",
    machineName: "emeauat-vm3",
    infraType: "windows",
    region: "EMEA",
    environment: "UAT",
    datacenter: "eu-west-1f",
    metrics: {
      cpu: { usage: 4.9, limit: 16, unit: "vCPU" },
      memory: { usage: 19.6, limit: 48, unit: "GiB" },
    },
    sericesInstances: ["svc-4103", "svc-4106", "svc-4109"],
  },
  {
    id: "namqa-task1",
    machineName: "namqa-task1",
    infraType: "ecs",
    region: "NAM",
    environment: "PROD",
    datacenter: "us-east-1a",
    metrics: {
      cpu: { request: 1.0, limit: 2.0, unit: "vCPU" },
      memory: { request: 2.5, limit: 6.0, unit: "GiB" },
      pods: { count: 5, unit: "pods" },
    },
    sericesInstances: ["svc-5001", "svc-5003", "svc-5006", "svc-5009", "svc-5012"],
  },
  {
    id: "namqa-task2",
    machineName: "namqa-task2",
    infraType: "ecs",
    region: "NAM",
    environment: "PROD",
    datacenter: "us-east-1b",
    metrics: {
      cpu: { request: 0.8, limit: 2.0, unit: "vCPU" },
      memory: { request: 2.1, limit: 6.0, unit: "GiB" },
      pods: { count: 4, unit: "pods" },
    },
    sericesInstances: ["svc-5002", "svc-5005", "svc-5008", "svc-5011"],
  },
  {
    id: "namqa-task3",
    machineName: "namqa-task3",
    infraType: "ecs",
    region: "NAM",
    environment: "PROD",
    datacenter: "us-east-1c",
    metrics: {
      cpu: { request: 1.2, limit: 2.0, unit: "vCPU" },
      memory: { request: 3.0, limit: 6.0, unit: "GiB" },
      pods: { count: 3, unit: "pods" },
    },
    sericesInstances: ["svc-5004", "svc-5007", "svc-5010"],
  },
  {
    id: "namuat-task1",
    machineName: "namuat-task1",
    infraType: "ecs",
    region: "NAM",
    environment: "UAT",
    datacenter: "us-east-1d",
    metrics: {
      cpu: { request: 0.6, limit: 4.0, unit: "vCPU" },
      memory: { request: 1.8, limit: 8.0, unit: "GiB" },
      pods: { count: 5, unit: "pods" },
    },
    sericesInstances: ["svc-5101", "svc-5104", "svc-5107", "svc-5110", "svc-5113"],
  },
  {
    id: "namuat-task2",
    machineName: "namuat-task2",
    infraType: "ecs",
    region: "NAM",
    environment: "UAT",
    datacenter: "us-east-1e",
    metrics: {
      cpu: { request: 0.9, limit: 4.0, unit: "vCPU" },
      memory: { request: 2.3, limit: 8.0, unit: "GiB" },
      pods: { count: 4, unit: "pods" },
    },
    sericesInstances: ["svc-5102", "svc-5105", "svc-5108", "svc-5111"],
  },
  {
    id: "namuat-task3",
    machineName: "namuat-task3",
    infraType: "ecs",
    region: "NAM",
    environment: "UAT",
    datacenter: "us-east-1f",
    metrics: {
      cpu: { request: 1.1, limit: 4.0, unit: "vCPU" },
      memory: { request: 2.8, limit: 8.0, unit: "GiB" },
      pods: { count: 3, unit: "pods" },
    },
    sericesInstances: ["svc-5103", "svc-5106", "svc-5109", "svc-5112"],
  },
];

function isEcsMetrics(metrics: InfraMetrics | EcsMetrics): metrics is EcsMetrics {
  return 'pods' in metrics;
}

export const InfraDetails: InfraDetail[] = rawInfraDetails
  .map((detail) => {
    const instances = detail.sericesInstances
      .map((id) => serviceInstanceById.get(id))
      .filter((instance): instance is ServicesInstance => Boolean(instance));

    // For ECS, use request vs limit; for VMs, use usage vs limit
    const cpuUtilization = isEcsMetrics(detail.metrics) 
      ? detail.metrics.cpu.request / detail.metrics.cpu.limit
      : detail.metrics.cpu.usage / detail.metrics.cpu.limit;
    
    const status = determineStatus(cpuUtilization * 100, 100);

    return {
      ...detail,
      status,
      servicesInstances: instances,
    };
  })
  .sort((a, b) => a.machineName.localeCompare(b.machineName));

export { serviceSummaryByName };
