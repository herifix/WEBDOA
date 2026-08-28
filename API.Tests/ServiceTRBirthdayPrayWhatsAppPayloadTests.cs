using System.Collections;
using System.Data;
using System.Reflection;
using System.Text.Json;
using API.Repository.global;
using API.Repository.Master;
using API.Repository.Transaction;
using API.Service.Transaction;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.FileProviders;
using Xunit;

namespace API.Tests;

public sealed class ServiceTRBirthdayPrayWhatsAppPayloadTests
{
    private const string Mp4Url = "https://public.example/media/birthday-pray.mp4";
    private const string HeaderImageUrl = "https://public.example/media/cake.jpg";

    [Fact]
    public void NewTemplatePayload_UsesImageHeaderFiveBodyParametersAndDefaultFollowUp()
    {
        var service = CreateService();

        object payload = InvokePrivate<object>(
            service,
            "BuildNewTemplatePayload",
            "628123456789",
            "phone-number-id",
            "ucapan_ulang_tahun_new5",
            "https://public.example/cake.jpg",
            "Donatur Test",
            "Pendoa Test",
            "Isi doa test",
            "+628987654321");

        using var document = JsonDocument.Parse(JsonSerializer.Serialize(payload));
        JsonElement root = document.RootElement;
        JsonElement template = root.GetProperty("template");
        JsonElement components = template.GetProperty("components");
        JsonElement headerParameter = components[0].GetProperty("parameters")[0];
        JsonElement bodyParameters = components[1].GetProperty("parameters");

        Assert.Equal("628123456789", root.GetProperty("phone_number").GetString());
        Assert.Equal("whatsapp", root.GetProperty("channel").GetString());
        Assert.Equal("template", root.GetProperty("message_type").GetString());
        Assert.Equal("phone-number-id", root.GetProperty("whatsapp_phone_number_id").GetString());
        Assert.Equal("ucapan_ulang_tahun_new5", template.GetProperty("name").GetString());
        Assert.Equal("en_US", template.GetProperty("language").GetProperty("code").GetString());
        Assert.Equal("header", components[0].GetProperty("type").GetString());
        Assert.Equal("image", headerParameter.GetProperty("type").GetString());
        Assert.Equal("https://public.example/cake.jpg", headerParameter.GetProperty("image").GetProperty("link").GetString());
        Assert.Equal("body", components[1].GetProperty("type").GetString());
        Assert.Equal(5, bodyParameters.GetArrayLength());
        Assert.Equal("Donatur Test", bodyParameters[0].GetProperty("text").GetString());
        Assert.Equal("Pendoa Test", bodyParameters[1].GetProperty("text").GetString());
        Assert.Equal(".", bodyParameters[2].GetProperty("text").GetString());
        Assert.Equal("Isi doa test", bodyParameters[3].GetProperty("text").GetString());
        Assert.Equal("+628987654321", bodyParameters[4].GetProperty("text").GetString());

        Type optionsType = typeof(ServiceTRBirthdayPray).GetNestedType(
            "WhatsAppSendExecutionOptions",
            BindingFlags.NonPublic)!;
        object options = Activator.CreateInstance(optionsType)!;
        bool includeFollowUpVoice = (bool)optionsType.GetProperty("IncludeFollowUpVoice")!.GetValue(options)!;
        Assert.True(includeFollowUpVoice);
    }

    [Fact]
    public void CombinedTemplateMode_OnlyMatchesTrimmedCaseInsensitiveNew6()
    {
        var service = CreateService();

        Assert.True(InvokePrivate<bool>(service, "ShouldUseCombinedVoiceMainTemplate", "  UCAPAN_ULANG_TAHUN_NEW6  "));
        Assert.False(InvokePrivate<bool>(service, "ShouldUseCombinedVoiceMainTemplate", "ucapan_ulang_tahun_new5"));
        Assert.False(InvokePrivate<bool>(service, "ShouldUseCombinedVoiceMainTemplate", "ucapan_ulang_tahun_new60"));
        Assert.False(InvokePrivate<bool>(service, "ShouldUseCombinedVoiceMainTemplate", "ucapan ulang tahun new6"));
        Assert.False(InvokePrivate<bool>(service, "ShouldUseCombinedVoiceMainTemplate", ""));
    }

    [Fact]
    public void FollowUpVoiceSelection_SendsOnlyForNonCombinedTemplatesWhenRequested()
    {
        var service = CreateService();

        Assert.True(InvokePrivate<bool>(service, "ShouldSendFollowUpVoice", "ucapan_ulang_tahun_new5", true));
        Assert.True(InvokePrivate<bool>(service, "ShouldSendFollowUpVoice", "template_lain", true));
        Assert.False(InvokePrivate<bool>(service, "ShouldSendFollowUpVoice", "  UCAPAN_ULANG_TAHUN_NEW6  ", true));
        Assert.False(InvokePrivate<bool>(service, "ShouldSendFollowUpVoice", "ucapan_ulang_tahun_new5", false));
    }

    [Fact]
    public void CombinedMainTemplatePayload_UsesVideoHeaderAndSameFiveBodyParameters()
    {
        var service = CreateService();

        object payload = InvokePrivate<object>(
            service,
            "BuildCombinedMainTemplatePayload",
            "628123456789",
            "phone-number-id",
            "  UCAPAN_ULANG_TAHUN_NEW6  ",
            "https://public.example/audio-message.mp4",
            "Donatur Test",
            "Pendoa Test",
            "Isi doa test",
            "+628987654321");

        using var document = JsonDocument.Parse(JsonSerializer.Serialize(payload));
        JsonElement root = document.RootElement;
        JsonElement template = root.GetProperty("template");
        JsonElement components = template.GetProperty("components");
        JsonElement headerParameter = components[0].GetProperty("parameters")[0];
        JsonElement bodyParameters = components[1].GetProperty("parameters");

        Assert.Equal("template", root.GetProperty("message_type").GetString());
        Assert.Equal("phone-number-id", root.GetProperty("whatsapp_phone_number_id").GetString());
        Assert.Equal("  UCAPAN_ULANG_TAHUN_NEW6  ", template.GetProperty("name").GetString());
        Assert.Equal("en_US", template.GetProperty("language").GetProperty("code").GetString());
        Assert.Equal("header", components[0].GetProperty("type").GetString());
        Assert.Equal("video", headerParameter.GetProperty("type").GetString());
        Assert.Equal("https://public.example/audio-message.mp4", headerParameter.GetProperty("video").GetProperty("link").GetString());
        Assert.False(headerParameter.TryGetProperty("image", out _));
        Assert.Equal("body", components[1].GetProperty("type").GetString());
        Assert.Equal(5, bodyParameters.GetArrayLength());
        Assert.Equal("Donatur Test", bodyParameters[0].GetProperty("text").GetString());
        Assert.Equal("Pendoa Test", bodyParameters[1].GetProperty("text").GetString());
        Assert.Equal(".", bodyParameters[2].GetProperty("text").GetString());
        Assert.Equal("Isi doa test", bodyParameters[3].GetProperty("text").GetString());
        Assert.Equal("+628987654321", bodyParameters[4].GetProperty("text").GetString());
    }

    [Fact]
    public async Task DebugSendWhatsApp_New6UsesOneDryRunVideoStageAndSkipsBlankVoiceTemplate()
    {
        var setting = BuildSetting("ucapan_ulang_tahun_new6", "");
        var (service, connection) = CreateDebugService(setting);

        ResponseData<object> response = await service.DebugSendWhatsApp(
            idDonatur: 10,
            year: 2026,
            runLive: false,
            includeFollowUpVoice: true);

        using JsonDocument document = AssertSuccessfulDebugResponse(response);
        JsonElement debug = document.RootElement;
        JsonElement mainStage = debug.GetProperty("mainTemplate");
        JsonElement followUpStage = debug.GetProperty("followUpVoiceTemplate");
        JsonElement payload = mainStage.GetProperty("PayloadSummary");
        JsonElement headerParameter = HeaderParameter(payload);

        Assert.True(mainStage.GetProperty("Attempted").GetBoolean());
        Assert.True(mainStage.GetProperty("Skipped").GetBoolean());
        Assert.Equal("dry_run", mainStage.GetProperty("SkippedReason").GetString());
        Assert.Equal("ucapan_ulang_tahun_new6", payload.GetProperty("template").GetProperty("name").GetString());
        Assert.Equal("video", headerParameter.GetProperty("type").GetString());
        Assert.Equal(Mp4Url, headerParameter.GetProperty("video").GetProperty("link").GetString());
        Assert.Equal(
            new[] { "Donatur Test", "Pendoa Test", ".", "Isi doa test", "+628987654321" },
            BodyTexts(payload));
        Assert.True(followUpStage.GetProperty("Success").GetBoolean());
        Assert.True(followUpStage.GetProperty("Skipped").GetBoolean());
        Assert.False(followUpStage.GetProperty("Attempted").GetBoolean());
        Assert.Equal("audio_embedded_in_main_template", followUpStage.GetProperty("SkippedReason").GetString());
        Assert.Equal(0, connection.MutationCount);
    }

    [Fact]
    public async Task DebugSendWhatsApp_New5UsesImageMainAndConfiguredVoiceFollowUpDryRunStages()
    {
        var setting = BuildSetting("ucapan_ulang_tahun_new5", "voice_template_configured");
        var (service, connection) = CreateDebugService(setting);

        ResponseData<object> response = await service.DebugSendWhatsApp(
            idDonatur: 10,
            year: 2026,
            runLive: false,
            includeFollowUpVoice: true);

        using JsonDocument document = AssertSuccessfulDebugResponse(response);
        JsonElement debug = document.RootElement;
        JsonElement mainStage = debug.GetProperty("mainTemplate");
        JsonElement followUpStage = debug.GetProperty("followUpVoiceTemplate");
        JsonElement mainPayload = mainStage.GetProperty("PayloadSummary");
        JsonElement followUpPayload = followUpStage.GetProperty("PayloadSummary");
        JsonElement headerParameter = HeaderParameter(mainPayload);

        Assert.True(mainStage.GetProperty("Attempted").GetBoolean());
        Assert.True(followUpStage.GetProperty("Attempted").GetBoolean());
        Assert.Equal("image", headerParameter.GetProperty("type").GetString());
        Assert.Equal(HeaderImageUrl, headerParameter.GetProperty("image").GetProperty("link").GetString());
        Assert.Equal("ucapan_ulang_tahun_new5", mainPayload.GetProperty("template").GetProperty("name").GetString());
        Assert.Equal("voice_template_configured", followUpPayload.GetProperty("template").GetProperty("name").GetString());
        Assert.Equal("video", HeaderParameter(followUpPayload).GetProperty("type").GetString());
        Assert.Equal(Mp4Url, HeaderParameter(followUpPayload).GetProperty("video").GetProperty("link").GetString());
        Assert.Equal(0, connection.MutationCount);
    }

    [Fact]
    public async Task DebugSendWhatsApp_UnrelatedTemplateWithFollowUpEnabledKeepsLegacyTwoStageBehavior()
    {
        var setting = BuildSetting("template_lain", "voice_template_configured");
        var (service, connection) = CreateDebugService(setting);

        ResponseData<object> response = await service.DebugSendWhatsApp(
            idDonatur: 10,
            year: 2026,
            runLive: false,
            includeFollowUpVoice: true);

        using JsonDocument document = AssertSuccessfulDebugResponse(response);
        JsonElement debug = document.RootElement;
        JsonElement mainStage = debug.GetProperty("mainTemplate");
        JsonElement followUpStage = debug.GetProperty("followUpVoiceTemplate");
        JsonElement mainPayload = mainStage.GetProperty("PayloadSummary");
        JsonElement followUpPayload = followUpStage.GetProperty("PayloadSummary");

        Assert.True(mainStage.GetProperty("Attempted").GetBoolean());
        Assert.True(followUpStage.GetProperty("Attempted").GetBoolean());
        Assert.Equal("image", HeaderParameter(mainPayload).GetProperty("type").GetString());
        Assert.Equal(HeaderImageUrl, HeaderParameter(mainPayload).GetProperty("image").GetProperty("link").GetString());
        Assert.Equal("template_lain", mainPayload.GetProperty("template").GetProperty("name").GetString());
        Assert.Equal("voice_template_configured", followUpPayload.GetProperty("template").GetProperty("name").GetString());
        Assert.Equal("video", HeaderParameter(followUpPayload).GetProperty("type").GetString());
        Assert.Equal(Mp4Url, HeaderParameter(followUpPayload).GetProperty("video").GetProperty("link").GetString());
        Assert.Equal(0, connection.MutationCount);
    }

    [Fact]
    public async Task DebugSendWhatsApp_UnrelatedTemplateWithFollowUpDisabledKeepsImageMainAndDisabledSkip()
    {
        var setting = BuildSetting("template_lain", "");
        var (service, connection) = CreateDebugService(setting);

        ResponseData<object> response = await service.DebugSendWhatsApp(
            idDonatur: 10,
            year: 2026,
            runLive: false,
            includeFollowUpVoice: false);

        using JsonDocument document = AssertSuccessfulDebugResponse(response);
        JsonElement debug = document.RootElement;
        JsonElement mainStage = debug.GetProperty("mainTemplate");
        JsonElement followUpStage = debug.GetProperty("followUpVoiceTemplate");
        JsonElement payload = mainStage.GetProperty("PayloadSummary");

        Assert.True(mainStage.GetProperty("Attempted").GetBoolean());
        Assert.Equal("image", HeaderParameter(payload).GetProperty("type").GetString());
        Assert.Equal("template_lain", payload.GetProperty("template").GetProperty("name").GetString());
        Assert.True(followUpStage.GetProperty("Success").GetBoolean());
        Assert.True(followUpStage.GetProperty("Skipped").GetBoolean());
        Assert.False(followUpStage.GetProperty("Attempted").GetBoolean());
        Assert.Equal("disabled_by_request", followUpStage.GetProperty("SkippedReason").GetString());
        Assert.Equal(0, connection.MutationCount);
    }

    [Fact]
    public async Task DebugSendWhatsApp_BlankMainTemplateIsRejectedWithoutMutation()
    {
        var setting = BuildSetting("", "");
        var (service, connection) = CreateDebugService(setting);

        ResponseData<object> response = await service.DebugSendWhatsApp(
            idDonatur: 10,
            year: 2026,
            runLive: false,
            includeFollowUpVoice: false);

        Assert.False(response.success);
        Assert.Equal("WA Template Name belum diatur di Application Setting.", response.message);
        Assert.Equal(0, connection.MutationCount);
    }

    [Fact]
    public async Task DebugSendWhatsApp_New6NormalizationKeepsTrimmedConfiguredOutboundTemplateName()
    {
        var setting = BuildSetting("  UCAPAN_ULANG_TAHUN_NEW6  ", "");
        var (service, connection) = CreateDebugService(setting);

        ResponseData<object> response = await service.DebugSendWhatsApp(
            idDonatur: 10,
            year: 2026,
            runLive: false,
            includeFollowUpVoice: true);

        using JsonDocument document = AssertSuccessfulDebugResponse(response);
        JsonElement payload = document.RootElement.GetProperty("mainTemplate").GetProperty("PayloadSummary");

        Assert.Equal("UCAPAN_ULANG_TAHUN_NEW6", payload.GetProperty("template").GetProperty("name").GetString());
        Assert.Equal("video", HeaderParameter(payload).GetProperty("type").GetString());
        Assert.Equal(0, connection.MutationCount);
    }

    private static ServiceTRBirthdayPray CreateService()
    {
        return new ServiceTRBirthdayPray(null!, null!, null!, null!, null!, null!, null!, null!, null!);
    }

    private static (ServiceTRBirthdayPray Service, FakeBirthdayPrayConnection Connection) CreateDebugService(
        ResponseModelApplicationSetting setting)
    {
        var connection = new FakeBirthdayPrayConnection(setting, BuildPrayData());
        IConfiguration configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["WhatsAppGateway:Url"] = "https://gateway.example/messages/send",
                ["WhatsAppGateway:DryRun"] = "true",
                ["Runtime:PublicBaseUrl"] = "https://public.example/api",
                ["VoiceStorage:Provider"] = "LocalServer",
                ["VoiceStorage:EnvironmentFolder"] = "test"
            })
            .Build();
        var environment = new TestWebHostEnvironment();
        var httpContextAccessor = new HttpContextAccessor { HttpContext = new DefaultHttpContext() };
        var voiceStorage = new ServiceVoiceStorage(
            connection,
            configuration,
            null!,
            null!,
            environment,
            httpContextAccessor);

        var service = new ServiceTRBirthdayPray(
            connection,
            new RepoTRBirthdayPray(),
            null!,
            new RepoApplicationSetting(),
            voiceStorage,
            null!,
            httpContextAccessor,
            environment,
            configuration);

        return (service, connection);
    }

    private static ResponseModelApplicationSetting BuildSetting(string mainTemplateName, string voiceTemplateName)
    {
        return new ResponseModelApplicationSetting
        {
            msgTemplate = "Halo <nama>, dari <pendoa>: <pesandoa>",
            msgLink = HeaderImageUrl,
            msgImage = HeaderImageUrl,
            whatsappTemplateName = mainTemplateName,
            whatsappVoiceTemplateName = voiceTemplateName,
            whatsappGatewayToken = "",
            whatsappPhoneNumberId = "phone-number-id",
            storageType = "LocalServer"
        };
    }

    private static ResponseModelTRBirthdayPray BuildPrayData()
    {
        return new ResponseModelTRBirthdayPray
        {
            id_TRBirthdayPray = 20,
            id_donatur = 10,
            id_pendoa = 30,
            namaDonatur = "Donatur Test",
            tglLahir = new DateTime(1990, 8, 28),
            birthdayDate = new DateTime(2026, 8, 28),
            noHPDonatur = "08123456789",
            namaPendoa = "Pendoa Test",
            noHPPendoa = "+628987654321",
            pesan = "Isi doa test",
            pathPesanSuara = Mp4Url,
            createdDate = new DateTime(2026, 8, 28, 7, 0, 0),
            isWASent = false
        };
    }

    private static JsonDocument AssertSuccessfulDebugResponse(ResponseData<object> response)
    {
        Assert.True(response.success, response.message);
        var document = JsonDocument.Parse(JsonSerializer.Serialize(response.data));
        JsonElement debug = document.RootElement;
        Assert.Equal("dry_run", debug.GetProperty("mode").GetString());
        Assert.True(debug.GetProperty("persistSkipped").GetBoolean());
        Assert.Equal(Mp4Url, debug.GetProperty("effectiveAudioUrl").GetString());
        return document;
    }

    private static JsonElement HeaderParameter(JsonElement payload)
    {
        foreach (JsonElement component in payload.GetProperty("template").GetProperty("components").EnumerateArray())
        {
            if (component.GetProperty("type").GetString() == "header")
            {
                return component.GetProperty("parameters")[0];
            }
        }

        throw new InvalidOperationException("Header component not found.");
    }

    private static string[] BodyTexts(JsonElement payload)
    {
        foreach (JsonElement component in payload.GetProperty("template").GetProperty("components").EnumerateArray())
        {
            if (component.GetProperty("type").GetString() == "body")
            {
                return component.GetProperty("parameters")
                    .EnumerateArray()
                    .Select(parameter => parameter.GetProperty("text").GetString()!)
                    .ToArray();
            }
        }

        throw new InvalidOperationException("Body component not found.");
    }

    private static T InvokePrivate<T>(object instance, string methodName, params object[] args)
    {
        MethodInfo? method = instance.GetType().GetMethod(methodName, BindingFlags.Instance | BindingFlags.NonPublic);
        Assert.NotNull(method);
        return Assert.IsAssignableFrom<T>(method.Invoke(instance, args));
    }

#pragma warning disable CS8766, CS8767
    private sealed class FakeBirthdayPrayConnection(
        ResponseModelApplicationSetting setting,
        ResponseModelTRBirthdayPray prayData) : IDbConnection
    {
        public int MutationCount { get; private set; }
        public string? ConnectionString { get; set; } = "";
        public int ConnectionTimeout => 0;
        public string Database => "FakeBirthdayPray";
        public ConnectionState State { get; private set; } = ConnectionState.Closed;

        public IDbTransaction BeginTransaction()
        {
            MutationCount++;
            return new FakeTransaction(this);
        }

        public IDbTransaction BeginTransaction(IsolationLevel il)
        {
            MutationCount++;
            return new FakeTransaction(this);
        }

        public void ChangeDatabase(string databaseName)
        {
        }

        public void Close()
        {
            State = ConnectionState.Closed;
        }

        public IDbCommand CreateCommand()
        {
            return new FakeCommand(this);
        }

        public void Open()
        {
            State = ConnectionState.Open;
        }

        public void Dispose()
        {
            Close();
        }

        private IDataReader ExecuteReader(string commandText)
        {
            if (commandText.Contains("FROM dbo.MsProg", StringComparison.OrdinalIgnoreCase))
            {
                return BuildSettingsTable().CreateDataReader();
            }

            if (commandText.Contains("FROM DonaturBirthday", StringComparison.OrdinalIgnoreCase))
            {
                return BuildPrayTable().CreateDataReader();
            }

            throw new InvalidOperationException($"Unexpected query: {commandText}");
        }

        private DataTable BuildSettingsTable()
        {
            var table = new DataTable();
            table.Columns.Add("msgTemplate", typeof(string));
            table.Columns.Add("msgLink", typeof(string));
            table.Columns.Add("msgImage", typeof(string));
            table.Columns.Add("whatsappTemplateName", typeof(string));
            table.Columns.Add("whatsappVoiceTemplateName", typeof(string));
            table.Columns.Add("whatsappGatewayToken", typeof(string));
            table.Columns.Add("whatsappPhoneNumberId", typeof(string));
            table.Columns.Add("storageType", typeof(string));
            table.Columns.Add("birthdayDashboardBeginDateOffsetDays", typeof(int));
            table.Rows.Add(
                setting.msgTemplate,
                setting.msgLink,
                setting.msgImage,
                setting.whatsappTemplateName,
                setting.whatsappVoiceTemplateName,
                setting.whatsappGatewayToken,
                setting.whatsappPhoneNumberId,
                setting.storageType,
                setting.birthdayDashboardBeginDateOffsetDays);
            return table;
        }

        private DataTable BuildPrayTable()
        {
            var table = new DataTable();
            table.Columns.Add("id_TRBirthdayPray", typeof(long));
            table.Columns.Add("id_donatur", typeof(long));
            table.Columns.Add("id_pendoa", typeof(long));
            table.Columns.Add("namaDonatur", typeof(string));
            table.Columns.Add("TglLahir", typeof(DateTime));
            table.Columns.Add("birthdayDate", typeof(DateTime));
            table.Columns.Add("noHPDonatur", typeof(string));
            table.Columns.Add("namaPendoa", typeof(string));
            table.Columns.Add("noHPPendoa", typeof(string));
            table.Columns.Add("pesan", typeof(string));
            table.Columns.Add("pathPesanSuara", typeof(string));
            table.Columns.Add("CreatedDate", typeof(DateTime));
            table.Columns.Add("isWASent", typeof(bool));
            table.Columns.Add("waSentDate", typeof(DateTime));
            table.Rows.Add(
                prayData.id_TRBirthdayPray,
                prayData.id_donatur,
                prayData.id_pendoa,
                prayData.namaDonatur,
                prayData.tglLahir,
                prayData.birthdayDate,
                prayData.noHPDonatur,
                prayData.namaPendoa,
                prayData.noHPPendoa,
                prayData.pesan,
                prayData.pathPesanSuara,
                prayData.createdDate,
                prayData.isWASent,
                DBNull.Value);
            return table;
        }

        private sealed class FakeCommand(FakeBirthdayPrayConnection connection) : IDbCommand
        {
            public string? CommandText { get; set; } = "";
            public int CommandTimeout { get; set; }
            public CommandType CommandType { get; set; }
            public IDbConnection? Connection { get; set; } = connection;
            public IDataParameterCollection Parameters { get; } = new FakeParameterCollection();
            public IDbTransaction? Transaction { get; set; }
            public UpdateRowSource UpdatedRowSource { get; set; }

            public void Cancel()
            {
            }

            public IDbDataParameter CreateParameter()
            {
                return new FakeParameter();
            }

            public void Dispose()
            {
            }

            public int ExecuteNonQuery()
            {
                connection.MutationCount++;
                return 1;
            }

            public IDataReader ExecuteReader()
            {
                return connection.ExecuteReader(CommandText ?? "");
            }

            public IDataReader ExecuteReader(CommandBehavior behavior)
            {
                return ExecuteReader();
            }

            public object? ExecuteScalar()
            {
                throw new InvalidOperationException("ExecuteScalar is not expected in these tests.");
            }

            public void Prepare()
            {
            }
        }
    }

    private sealed class FakeTransaction(IDbConnection connection) : IDbTransaction
    {
        public IDbConnection Connection { get; } = connection;
        public IsolationLevel IsolationLevel => IsolationLevel.Unspecified;

        public void Commit()
        {
        }

        public void Dispose()
        {
        }

        public void Rollback()
        {
        }
    }

    private sealed class FakeParameterCollection : ArrayList, IDataParameterCollection
    {
        public object this[string parameterName]
        {
            get => this[IndexOf(parameterName)]!;
            set => this[IndexOf(parameterName)] = value;
        }

        public bool Contains(string parameterName)
        {
            return IndexOf(parameterName) >= 0;
        }

        public int IndexOf(string parameterName)
        {
            for (int i = 0; i < Count; i++)
            {
                if (this[i] is IDataParameter parameter &&
                    string.Equals(parameter.ParameterName, parameterName, StringComparison.OrdinalIgnoreCase))
                {
                    return i;
                }
            }

            return -1;
        }

        public void RemoveAt(string parameterName)
        {
            int index = IndexOf(parameterName);
            if (index >= 0)
            {
                RemoveAt(index);
            }
        }
    }

    private sealed class FakeParameter : IDbDataParameter
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

    private sealed class TestWebHostEnvironment : IWebHostEnvironment
    {
        public string ApplicationName { get; set; } = "API.Tests";
        public IFileProvider WebRootFileProvider { get; set; } = new NullFileProvider();
        public string WebRootPath { get; set; } = Path.GetTempPath();
        public string EnvironmentName { get; set; } = "Development";
        public string ContentRootPath { get; set; } = Path.GetTempPath();
        public IFileProvider ContentRootFileProvider { get; set; } = new NullFileProvider();
    }
#pragma warning restore CS8766, CS8767
}
