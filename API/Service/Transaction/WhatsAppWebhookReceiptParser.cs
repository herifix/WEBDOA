using System.Globalization;
using System.Text.Json;

namespace API.Service.Transaction;

public static class WhatsAppWebhookReceiptParser
{
    public static IReadOnlyList<WhatsAppDeliveryReceipt> Parse(JsonElement payload)
    {
        var receipts = new Dictionary<string, WhatsAppDeliveryReceipt>(StringComparer.Ordinal);
        Visit(payload, receipts);
        return receipts.Values.ToList();
    }

    private static void Visit(JsonElement element, IDictionary<string, WhatsAppDeliveryReceipt> receipts)
    {
        if (element.ValueKind == JsonValueKind.Array)
        {
            foreach (JsonElement item in element.EnumerateArray())
            {
                Visit(item, receipts);
            }

            return;
        }

        if (element.ValueKind != JsonValueKind.Object)
        {
            return;
        }

        AddReceipt(element, receipts);
        foreach (JsonProperty property in element.EnumerateObject())
        {
            Visit(property.Value, receipts);
        }
    }

    private static void AddReceipt(JsonElement element, IDictionary<string, WhatsAppDeliveryReceipt> receipts)
    {
        string status = NormalizeStatus(GetString(element, "status"));
        if (string.IsNullOrEmpty(status))
        {
            status = NormalizeStatus(GetString(element, "event"));
        }

        string messageId = GetString(element, "messageId", "message_id", "wamId", "wam_id", "id");
        if (string.IsNullOrWhiteSpace(status) || string.IsNullOrWhiteSpace(messageId))
        {
            return;
        }

        receipts[messageId] = new WhatsAppDeliveryReceipt
        {
            gatewayMessageId = messageId,
            status = status,
            recipientPhoneNumber = NormalizePhoneNumber(GetString(element, "phoneNumber", "phone_number", "recipient_id", "recipientId", "to")),
            occurredAt = ParseTimestamp(GetString(element, "timestamp", "occurredAt", "occurred_at", "updatedAt", "updated_at"))
        };
    }

    private static string NormalizeStatus(string value)
    {
        string normalized = value.Trim().ToUpperInvariant();
        return normalized switch
        {
            "SENT" or "MESSAGE.SENT" => "SENT",
            "DELIVERED" or "MESSAGE.DELIVERED" => "DELIVERED",
            "READ" or "MESSAGE.READ" => "READ",
            "FAILED" or "MESSAGE.FAILED" => "FAILED",
            _ => ""
        };
    }

    private static string NormalizePhoneNumber(string value)
    {
        string digits = new(value.Where(char.IsDigit).ToArray());
        return digits.StartsWith('0') ? "62" + digits[1..] : digits;
    }

    private static DateTimeOffset? ParseTimestamp(string value)
    {
        if (long.TryParse(value, NumberStyles.Integer, CultureInfo.InvariantCulture, out long unixValue))
        {
            return value.Length >= 13
                ? DateTimeOffset.FromUnixTimeMilliseconds(unixValue)
                : DateTimeOffset.FromUnixTimeSeconds(unixValue);
        }

        return DateTimeOffset.TryParse(value, CultureInfo.InvariantCulture, DateTimeStyles.AssumeUniversal, out DateTimeOffset timestamp)
            ? timestamp
            : null;
    }

    private static string GetString(JsonElement element, params string[] names)
    {
        foreach (string name in names)
        {
            foreach (JsonProperty property in element.EnumerateObject())
            {
                if (property.Name.Equals(name, StringComparison.OrdinalIgnoreCase) &&
                    property.Value.ValueKind is JsonValueKind.String or JsonValueKind.Number)
                {
                    return property.Value.ToString().Trim();
                }
            }
        }

        return "";
    }
}
