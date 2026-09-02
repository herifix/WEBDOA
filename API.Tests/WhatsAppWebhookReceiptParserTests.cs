using API.Service.Transaction;
using System.Text.Json;
using Xunit;

namespace API.Tests;

public sealed class WhatsAppWebhookReceiptParserTests
{
    [Fact]
    public void Parse_ReturnsDeliveredReceipt_WhenGatewaySendsEventEnvelope()
    {
        using JsonDocument document = JsonDocument.Parse("""
        {
          "event": "message.delivered",
          "data": {
            "messageId": "wamid.provider-123",
            "status": "delivered",
            "phoneNumber": "628123456789",
            "timestamp": "2026-09-01T10:15:00Z"
          }
        }
        """);

        IReadOnlyList<WhatsAppDeliveryReceipt> receipts =
            WhatsAppWebhookReceiptParser.Parse(document.RootElement);

        WhatsAppDeliveryReceipt receipt = Assert.Single(receipts);
        Assert.Equal("wamid.provider-123", receipt.gatewayMessageId);
        Assert.Equal("DELIVERED", receipt.status);
        Assert.Equal("628123456789", receipt.recipientPhoneNumber);
        Assert.Equal(DateTimeOffset.Parse("2026-09-01T10:15:00Z"), receipt.occurredAt);
    }

    [Fact]
    public void Parse_ReturnsReadReceipt_WhenMetaStatusArrayIsNested()
    {
        using JsonDocument document = JsonDocument.Parse("""
        {
          "entry": [{
            "changes": [{
              "value": {
                "statuses": [{
                  "id": "wamid.meta-456",
                  "status": "read",
                  "recipient_id": "628987654321",
                  "timestamp": "1788257700"
                }]
              }
            }]
          }]
        }
        """);

        IReadOnlyList<WhatsAppDeliveryReceipt> receipts =
            WhatsAppWebhookReceiptParser.Parse(document.RootElement);

        WhatsAppDeliveryReceipt receipt = Assert.Single(receipts);
        Assert.Equal("wamid.meta-456", receipt.gatewayMessageId);
        Assert.Equal("READ", receipt.status);
        Assert.Equal("628987654321", receipt.recipientPhoneNumber);
        Assert.Equal(DateTimeOffset.FromUnixTimeSeconds(1788257700), receipt.occurredAt);
    }
}
