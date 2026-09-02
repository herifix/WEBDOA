using API.Repository.Transaction;
using API.Service.Transaction;
using Microsoft.Extensions.Configuration;
using System.Collections;
using System.Data;
using System.Text.Json;
using Xunit;

namespace API.Tests;

public sealed class WhatsAppDeliveryWebhookServiceTests
{
    [Fact]
    public void ReceiveWhatsAppDeliveryWebhook_PersistsDeliveredReceipt_WhenTokenAndPayloadAreValid()
    {
        var connection = new RecordingConnection();
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["WhatsAppGateway:WebhookToken"] = "test-webhook-token"
            })
            .Build();
        var service = new ServiceTRBirthdayPray(
            connection,
            new RepoTRBirthdayPray(),
            null!,
            null!,
            null!,
            null!,
            null!,
            null!,
            configuration);

        using var payload = JsonDocument.Parse("""
        {
          "event": "message.delivered",
          "data": {
            "messageId": "wamid.delivery-123",
            "status": "delivered",
            "phoneNumber": "628123456789",
            "timestamp": "2026-09-01T10:15:00Z"
          }
        }
        """);

        ResponseData<object> response = service.ReceiveWhatsAppDeliveryWebhook(
            "test-webhook-token",
            payload.RootElement);

        Assert.True(response.success, response.message);
        Assert.Equal(1, connection.NonQueryCount);
        Assert.Equal(ConnectionState.Closed, connection.State);
    }

    [Fact]
    public void ReceiveWhatsAppDeliveryWebhook_RejectsInvalidToken_WithoutPersisting()
    {
        var connection = new RecordingConnection();
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["WhatsAppGateway:WebhookToken"] = "test-webhook-token"
            })
            .Build();
        var service = new ServiceTRBirthdayPray(
            connection,
            new RepoTRBirthdayPray(),
            null!,
            null!,
            null!,
            null!,
            null!,
            null!,
            configuration);

        using var payload = JsonDocument.Parse(""" { "status": "read", "id": "wamid.read-123" } """);

        ResponseData<object> response = service.ReceiveWhatsAppDeliveryWebhook(
            "wrong-token",
            payload.RootElement);

        Assert.False(response.success);
        Assert.Equal("Webhook token tidak valid.", response.message);
        Assert.Equal(0, connection.NonQueryCount);
    }

#pragma warning disable CS8766, CS8767
    private sealed class RecordingConnection : IDbConnection
    {
        public int NonQueryCount { get; private set; }
        public string? ConnectionString { get; set; } = "";
        public int ConnectionTimeout => 0;
        public string Database => "WebhookTest";
        public ConnectionState State { get; private set; } = ConnectionState.Closed;

        public IDbTransaction BeginTransaction() => throw new NotSupportedException();
        public IDbTransaction BeginTransaction(IsolationLevel il) => throw new NotSupportedException();
        public void ChangeDatabase(string databaseName) { }
        public void Close() => State = ConnectionState.Closed;
        public IDbCommand CreateCommand() => new RecordingCommand(this);
        public void Dispose() => Close();
        public void Open() => State = ConnectionState.Open;

        private sealed class RecordingCommand(RecordingConnection connection) : IDbCommand
        {
            public string? CommandText { get; set; }
            public int CommandTimeout { get; set; }
            public CommandType CommandType { get; set; }
            public IDbConnection? Connection { get; set; } = connection;
            public IDataParameterCollection Parameters { get; } = new ParameterCollection();
            public IDbTransaction? Transaction { get; set; }
            public UpdateRowSource UpdatedRowSource { get; set; }

            public void Cancel() { }
            public IDbDataParameter CreateParameter() => new Parameter();
            public void Dispose() { }
            public int ExecuteNonQuery() => ++connection.NonQueryCount;
            public IDataReader ExecuteReader() => throw new NotSupportedException();
            public IDataReader ExecuteReader(CommandBehavior behavior) => ExecuteReader();
            public object? ExecuteScalar() => throw new NotSupportedException();
            public void Prepare() { }
        }

        private sealed class ParameterCollection : ArrayList, IDataParameterCollection
        {
            public object this[string parameterName]
            {
                get => this[IndexOf(parameterName)]!;
                set => this[IndexOf(parameterName)] = value;
            }

            public bool Contains(string parameterName) => IndexOf(parameterName) >= 0;
            public int IndexOf(string parameterName) =>
                this.Cast<IDataParameter>().ToList().FindIndex(parameter =>
                    string.Equals(parameter.ParameterName, parameterName, StringComparison.OrdinalIgnoreCase));
            public void RemoveAt(string parameterName)
            {
                int index = IndexOf(parameterName);
                if (index >= 0) RemoveAt(index);
            }
        }

        private sealed class Parameter : IDbDataParameter
        {
            public DbType DbType { get; set; }
            public ParameterDirection Direction { get; set; } = ParameterDirection.Input;
            public bool IsNullable => true;
            public string? ParameterName { get; set; } = "";
            public string? SourceColumn { get; set; } = "";
            public DataRowVersion SourceVersion { get; set; } = DataRowVersion.Current;
            public object? Value { get; set; }
            public byte Precision { get; set; }
            public byte Scale { get; set; }
            public int Size { get; set; }
        }
    }
#pragma warning restore CS8766, CS8767
}
