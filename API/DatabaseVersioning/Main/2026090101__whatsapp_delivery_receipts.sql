SET NOCOUNT ON;

IF OBJECT_ID('dbo.TRBirthdayPrayWADeliveryReceipt', 'U') IS NULL
BEGIN
    EXEC(N'
CREATE TABLE dbo.TRBirthdayPrayWADeliveryReceipt
(
    Id BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    GatewayMessageId NVARCHAR(255) NOT NULL,
    DeliveryStatus NVARCHAR(20) NOT NULL,
    RecipientPhoneNumber NVARCHAR(32) NOT NULL CONSTRAINT DF_TRBirthdayPrayWADeliveryReceipt_RecipientPhoneNumber DEFAULT (''''),
    OccurredAt DATETIMEOFFSET NOT NULL,
    ReceivedAt DATETIMEOFFSET NOT NULL CONSTRAINT DF_TRBirthdayPrayWADeliveryReceipt_ReceivedAt DEFAULT (SYSDATETIMEOFFSET()),
    CONSTRAINT UQ_TRBirthdayPrayWADeliveryReceipt_GatewayMessageId UNIQUE (GatewayMessageId)
);');
END;

IF NOT EXISTS
(
    SELECT 1
    FROM sys.indexes
    WHERE object_id = OBJECT_ID('dbo.TRBirthdayPrayWADeliveryReceipt')
      AND name = 'IX_TRBirthdayPrayWADeliveryReceipt_RecipientPhoneNumber_OccurredAt'
)
BEGIN
    CREATE INDEX IX_TRBirthdayPrayWADeliveryReceipt_RecipientPhoneNumber_OccurredAt
        ON dbo.TRBirthdayPrayWADeliveryReceipt (RecipientPhoneNumber, OccurredAt DESC);
END;
