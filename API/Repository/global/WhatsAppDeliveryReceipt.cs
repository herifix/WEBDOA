public sealed class WhatsAppDeliveryReceipt
{
    public string gatewayMessageId { get; init; } = "";
    public string status { get; init; } = "";
    public string recipientPhoneNumber { get; init; } = "";
    public DateTimeOffset? occurredAt { get; init; }
}
