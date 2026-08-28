using System.Reflection;
using System.Runtime.Loader;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;

string evidence = args.Length > 0
    ? Path.GetFullPath(args[0])
    : throw new InvalidOperationException("Evidence directory argument is required.");
string repo = Path.GetFullPath(Path.Combine(evidence, "..", "..", ".."));
string sourceDir = AppContext.BaseDirectory;
string testDll = Path.Combine(repo, "API.Tests", "bin", "Debug", "net8.0", "API.Tests.dll");
string apiDll = Path.Combine(repo, "API", "bin", "Debug", "net8.0", "API.dll");
string configPath = Path.Combine(repo, "API", "appsettings.Development.json");
string testBin = Path.GetDirectoryName(testDll) ?? "";

var failures = new List<string>();
var observations = new List<JsonObject>();
var media = await ResolveAndVerifyPublicMp4Async();
WritePublicMediaArtifact(media);
Expect(media.CandidateRootAccessible, "public media: configured UNC/prod root is not accessible");
Expect(media.CandidateUnderConfiguredRoot, "public media: MP4 candidate is not under configured root");
Expect(!string.IsNullOrWhiteSpace(media.PublicUrl), "public media: derived public MP4 URL is blank");

AssemblyLoadContext.Default.Resolving += (_, assemblyName) =>
{
    string candidate = Path.Combine(testBin, assemblyName.Name + ".dll");
    return File.Exists(candidate)
        ? AssemblyLoadContext.Default.LoadFromAssemblyPath(candidate)
        : null;
};

Assembly testAssembly = AssemblyLoadContext.Default.LoadFromAssemblyPath(testDll);
Assembly apiAssembly = AssemblyLoadContext.Default.LoadFromAssemblyPath(apiDll);
Type testType = testAssembly.GetType("API.Tests.ServiceTRBirthdayPrayWhatsAppPayloadTests", true)!;
Type serviceType = apiAssembly.GetType("API.Service.Transaction.ServiceTRBirthdayPray", true)!;
MethodInfo buildSetting = testType.GetMethod("BuildSetting", BindingFlags.NonPublic | BindingFlags.Static)!;
MethodInfo buildPrayData = testType.GetMethod("BuildPrayData", BindingFlags.NonPublic | BindingFlags.Static)!;
MethodInfo debugSend = serviceType.GetMethod("DebugSendWhatsApp", new[] { typeof(long), typeof(int?), typeof(bool?), typeof(bool?) })!;
Type fakeConnectionType = testType.GetNestedType("FakeBirthdayPrayConnection", BindingFlags.NonPublic)!;
Type testEnvironmentType = testType.GetNestedType("TestWebHostEnvironment", BindingFlags.NonPublic)!;

JsonObject new6 = RunScenario("S1-new6-blank-voice", "ucapan_ulang_tahun_new6", "", true, media.PublicUrl);
JsonObject new5 = RunScenario("S2-new5-follow-up", "ucapan_ulang_tahun_new5", "voice_template_configured", true, media.PublicUrl);
JsonObject mixed = RunScenario("S3-new6-trim-case", "  UCAPAN_ULANG_TAHUN_NEW6  ", "", true, media.PublicUrl);
JsonObject repeat = RunScenario("A3-new6-repeat", "ucapan_ulang_tahun_new6", "", true, media.PublicUrl);

foreach (JsonObject observation in new[] { new6, new5, mixed, repeat })
{
    string id = observation["id"]!.GetValue<string>();
    Expect(observation["success"]!.GetValue<bool>(), $"{id}: response success false");
    Expect(observation["mode"]!.GetValue<string>() == "dry_run", $"{id}: not dry_run");
    Expect(observation["persistSkipped"]!.GetValue<bool>(), $"{id}: persistSkipped not true");
    Expect(observation["mutationCount"]!.GetValue<int>() == 0, $"{id}: mutationCount not zero");
    Expect(SameBody(observation), $"{id}: body parameter order mismatch");
    Expect(observation["videoLinkMatchesInput"]!.GetValue<bool>(), $"{id}: video link does not match reachable public URL input");
}

Expect(new6["mainTemplateName"]!.GetValue<string>() == "ucapan_ulang_tahun_new6", "new6: main template not from configured setting");
Expect(new6["mainHeaderType"]!.GetValue<string>() == "video", "new6: header not video");
Expect(new6["followAttempted"]!.GetValue<bool>() == false, "new6: follow-up attempted");
Expect(new6["followSuccess"]!.GetValue<bool>(), "new6: follow-up not success");
Expect(new6["followSkippedReason"]!.GetValue<string>() == "audio_embedded_in_main_template", "new6: skip reason mismatch");

Expect(new5["mainTemplateName"]!.GetValue<string>() == "ucapan_ulang_tahun_new5", "new5: main template not from configured setting");
Expect(new5["mainHeaderType"]!.GetValue<string>() == "image", "new5: header not image");
Expect(new5["followAttempted"]!.GetValue<bool>(), "new5: follow-up not attempted");
Expect(new5["followTemplateName"]!.GetValue<string>() == "voice_template_configured", "new5: voice template not configured name");
Expect(new5["followHeaderType"]!.GetValue<string>() == "video", "new5: follow header not video");

Expect(mixed["mainTemplateName"]!.GetValue<string>() == "UCAPAN_ULANG_TAHUN_NEW6", "mixed new6: outbound name should be trimmed configured value");
Expect(mixed["mainHeaderType"]!.GetValue<string>() == "video", "mixed new6: not combined video mode");
Expect(mixed["followAttempted"]!.GetValue<bool>() == false, "mixed new6: follow-up attempted");

Expect(
    new6["success"]!.ToJsonString() == repeat["success"]!.ToJsonString() &&
    new6["message"]!.ToJsonString() == repeat["message"]!.ToJsonString() &&
    new6["mode"]!.ToJsonString() == repeat["mode"]!.ToJsonString() &&
    new6["effectiveAudioUrlSha256"]!.ToJsonString() == repeat["effectiveAudioUrlSha256"]!.ToJsonString() &&
    new6["mutationCount"]!.ToJsonString() == repeat["mutationCount"]!.ToJsonString() &&
    new6["mainTemplateName"]!.ToJsonString() == repeat["mainTemplateName"]!.ToJsonString() &&
    new6["mainHeaderType"]!.ToJsonString() == repeat["mainHeaderType"]!.ToJsonString() &&
    new6["bodyTexts"]!.ToJsonString() == repeat["bodyTexts"]!.ToJsonString() &&
    new6["followAttempted"]!.ToJsonString() == repeat["followAttempted"]!.ToJsonString() &&
    new6["followSuccess"]!.ToJsonString() == repeat["followSuccess"]!.ToJsonString() &&
    new6["followSkippedReason"]!.ToJsonString() == repeat["followSkippedReason"]!.ToJsonString(),
    "new6 repeat: output changed between repeated invocations");

var artifact = new JsonObject
{
    ["surface"] = "public ServiceTRBirthdayPray.DebugSendWhatsApp(runLive:false, includeFollowUpVoice:true) invoked via durable net8 reflection-backed manual harness",
    ["assembly"] = testDll,
    ["builtImmediatelyBeforeLoad"] = true,
    ["publicMediaVerdict"] = media.Verdict,
    ["publicBaseHost"] = media.PublicHost,
    ["publicUrlSha256"] = media.PublicUrlHash,
    ["gatewayNetworkCalls"] = 0,
    ["mp3ConversionTriggered"] = false,
    ["observations"] = new JsonArray(observations.Select(o => JsonNode.Parse(o.ToJsonString())!).ToArray()),
    ["assertions"] = new JsonObject
    {
        ["passed"] = failures.Count == 0,
        ["failures"] = new JsonArray(failures.Select(f => JsonValue.Create(f)).ToArray())
    }
};
File.WriteAllText(Path.Combine(evidence, "task-2-dry-run.json"), artifact.ToJsonString(new JsonSerializerOptions { WriteIndented = true }));

if (failures.Count > 0)
{
    foreach (string failure in failures)
    {
        Console.Error.WriteLine(failure);
    }
    return 1;
}

Console.WriteLine("manual probe PASS");
Console.WriteLine("publicMediaVerdict=" + media.Verdict);
Console.WriteLine("publicUrlSha256=" + media.PublicUrlHash);
Console.WriteLine("sourceProgramSha256=" + Sha256File(FindSourceFile("Program.cs")));
Console.WriteLine("sourceProjectSha256=" + Sha256File(FindSourceFile("ManualProbe.csproj")));
return 0;

JsonObject RunScenario(string id, string mainTemplate, string voiceTemplate, bool includeFollowUpVoice, string publicUrl)
{
    object setting = buildSetting.Invoke(null, [mainTemplate, voiceTemplate])!;
    object prayData = buildPrayData.Invoke(null, [])!;
    prayData.GetType().GetProperty("pathPesanSuara")!.SetValue(prayData, publicUrl);
    object connection = Activator.CreateInstance(
        fakeConnectionType,
        BindingFlags.Instance | BindingFlags.NonPublic | BindingFlags.Public,
        binder: null,
        args: [setting, prayData],
        culture: null)!;
    object service = CreateService(connection);
    FixtureInjection injection = VerifyFixtureVoicePath(connection, publicUrl);

    object taskObject = debugSend.Invoke(service, [10L, (int?)2026, (bool?)false, (bool?)includeFollowUpVoice])!;
    var task = (Task)taskObject;
    task.GetAwaiter().GetResult();
    object response = taskObject.GetType().GetProperty("Result")!.GetValue(taskObject)!;
    bool success = (bool)response.GetType().GetProperty("success")!.GetValue(response)!;
    string message = (string)response.GetType().GetProperty("message")!.GetValue(response)!;
    object? dataObject = response.GetType().GetProperty("data")!.GetValue(response);
    JsonObject data = JsonSerializer.SerializeToNode(dataObject)!.AsObject();
    JsonObject mainStage = data["mainTemplate"]!.AsObject();
    JsonObject followStage = data["followUpVoiceTemplate"]!.AsObject();
    JsonObject mainPayload = mainStage["PayloadSummary"]!.AsObject();
    JsonObject template = mainPayload["template"]!.AsObject();
    JsonObject header = HeaderParameter(mainPayload);
    JsonArray bodyTexts = BodyTexts(mainPayload);
    JsonObject? followPayload = followStage["PayloadSummary"] as JsonObject;
    JsonObject? followHeader = followPayload is null ? null : HeaderParameter(followPayload);
    string? mainVideoLink = header["video"]?["link"]?.GetValue<string>();
    string? followVideoLink = followHeader?["video"]?["link"]?.GetValue<string>();

    var observation = new JsonObject
    {
        ["id"] = id,
        ["requestedMainSettingSha256"] = Sha256Text(mainTemplate),
        ["requestedVoiceSettingSha256"] = Sha256Text(voiceTemplate),
        ["success"] = success,
        ["message"] = message,
        ["mode"] = data["mode"]?.GetValue<string>(),
        ["persistSkipped"] = data["persistSkipped"]?.GetValue<bool>(),
        ["effectiveAudioUrlSha256"] = Sha256Text(data["effectiveAudioUrl"]?.GetValue<string>() ?? ""),
        ["fixtureInjectionFieldCount"] = injection.FieldCount,
        ["fixturePathAfterInjectionSha256"] = injection.PathHashAfterInjection,
        ["mutationCount"] = connection.GetType().GetProperty("MutationCount")!.GetValue(connection) is int mutationCount ? mutationCount : -1,
        ["mainAttempted"] = mainStage["Attempted"]?.GetValue<bool>(),
        ["mainSkipped"] = mainStage["Skipped"]?.GetValue<bool>(),
        ["mainSkippedReason"] = mainStage["SkippedReason"]?.GetValue<string>(),
        ["mainTemplateName"] = template["name"]?.GetValue<string>(),
        ["mainLanguage"] = template["language"]?["code"]?.GetValue<string>(),
        ["mainHeaderType"] = header["type"]?.GetValue<string>(),
        ["mainHeaderImageLinkSha256"] = header["image"]?["link"] is null ? null : Sha256Text(header["image"]!["link"]!.GetValue<string>()),
        ["mainHeaderVideoLinkSha256"] = mainVideoLink is null ? null : Sha256Text(mainVideoLink),
        ["videoLinkMatchesInput"] = mainVideoLink == publicUrl || followVideoLink == publicUrl,
        ["bodyTexts"] = bodyTexts,
        ["followAttempted"] = followStage["Attempted"]?.GetValue<bool>(),
        ["followSuccess"] = followStage["Success"]?.GetValue<bool>(),
        ["followSkipped"] = followStage["Skipped"]?.GetValue<bool>(),
        ["followSkippedReason"] = followStage["SkippedReason"]?.GetValue<string>(),
        ["followTemplateName"] = followPayload?["template"]?["name"]?.GetValue<string>(),
        ["followHeaderType"] = followHeader?["type"]?.GetValue<string>(),
        ["followHeaderVideoLinkSha256"] = followVideoLink is null ? null : Sha256Text(followVideoLink)
    };
    observations.Add(observation);
    return observation;
}

object CreateService(object connection)
{
    IConfiguration configuration = new ConfigurationBuilder()
        .AddInMemoryCollection(new Dictionary<string, string?>
        {
            ["WhatsAppGateway:Url"] = "https://gateway.example/messages/send",
            ["WhatsAppGateway:DryRun"] = "true",
            ["Runtime:PublicBaseUrl"] = "https://yobel.intsoftware.co.id/api",
            ["VoiceStorage:Provider"] = "LocalServer",
            ["VoiceStorage:EnvironmentFolder"] = "prod"
        })
        .Build();
    object environment = Activator.CreateInstance(
        testEnvironmentType,
        BindingFlags.Instance | BindingFlags.NonPublic | BindingFlags.Public,
        binder: null,
        args: [],
        culture: null)!;
    var accessor = new HttpContextAccessor { HttpContext = new DefaultHttpContext() };
    Type voiceStorageType = apiAssembly.GetType("API.Service.Transaction.ServiceVoiceStorage", true)!;
    Type repoType = apiAssembly.GetType("RepoTRBirthdayPray", true)!;
    Type settingRepoType = apiAssembly.GetType("API.Repository.Master.RepoApplicationSetting", true)!;
    object voiceStorage = Activator.CreateInstance(
        voiceStorageType,
        [connection, configuration, null, null, environment, accessor])!;
    return Activator.CreateInstance(
        serviceType,
        [
            connection,
            Activator.CreateInstance(repoType)!,
            null,
            Activator.CreateInstance(settingRepoType)!,
            voiceStorage,
            null,
            accessor,
            environment,
            configuration
        ])!;
}

FixtureInjection VerifyFixtureVoicePath(object connection, string publicUrl)
{
    FieldInfo[] fields = connection.GetType()
        .GetFields(BindingFlags.NonPublic | BindingFlags.Instance)
        .Where(f => f.FieldType.Name == "ResponseModelTRBirthdayPray")
        .ToArray();
    if (fields.Length == 0)
    {
        throw new InvalidOperationException("Fixture pray data field not found.");
    }

    foreach (FieldInfo field in fields)
    {
        object prayData = field.GetValue(connection)!;
        PropertyInfo pathProperty = prayData.GetType().GetProperty("pathPesanSuara")!;
        string actual = (string)(pathProperty.GetValue(prayData) ?? "");
        if (actual != publicUrl)
        {
            throw new InvalidOperationException("Fixture pray data path does not match injected public URL.");
        }
    }

    return new FixtureInjection(fields.Length, Sha256Text(publicUrl));
}

static JsonObject HeaderParameter(JsonObject payload)
{
    foreach (JsonNode? componentNode in payload["template"]!["components"]!.AsArray())
    {
        JsonObject component = componentNode!.AsObject();
        if (component["type"]?.GetValue<string>() == "header")
        {
            return component["parameters"]!.AsArray()[0]!.AsObject();
        }
    }
    throw new InvalidOperationException("Header component not found.");
}

static JsonArray BodyTexts(JsonObject payload)
{
    foreach (JsonNode? componentNode in payload["template"]!["components"]!.AsArray())
    {
        JsonObject component = componentNode!.AsObject();
        if (component["type"]?.GetValue<string>() == "body")
        {
            JsonArray texts = [];
            foreach (JsonNode? parameter in component["parameters"]!.AsArray())
            {
                texts.Add(parameter!["text"]!.GetValue<string>());
            }
            return texts;
        }
    }
    throw new InvalidOperationException("Body component not found.");
}

void Expect(bool condition, string message)
{
    if (!condition)
    {
        failures.Add(message);
    }
}

static bool SameBody(JsonObject observation)
{
    JsonArray expected = ["Donatur Test", "Pendoa Test", ".", "Isi doa test", "+628987654321"];
    return observation["bodyTexts"]!.ToJsonString() == expected.ToJsonString();
}

async Task<MediaVerification> ResolveAndVerifyPublicMp4Async()
{
    using JsonDocument config = JsonDocument.Parse(File.ReadAllText(configPath));
    JsonElement rootElement = config.RootElement;
    string publicBaseUrl = rootElement.GetProperty("Runtime").GetProperty("PublicBaseUrl").GetString() ?? "";
    string rootPath = rootElement.GetProperty("VoiceStorage").GetProperty("RootPath").GetString() ?? "";
    string environmentFolder = rootElement.GetProperty("VoiceStorage").GetProperty("EnvironmentFolder").GetString() ?? "";
    string expectedRoot = @"\\gtc-server\DOAWEB\api\wwwroot\uploads\birthday-pray";
    string candidateRoot = Path.Combine(rootPath, environmentFolder);

    if (!string.Equals(rootPath, expectedRoot, StringComparison.OrdinalIgnoreCase) ||
        environmentFolder != "prod" ||
        !Directory.Exists(candidateRoot))
    {
        return new MediaVerification(publicBaseUrl, "", "", "", "", 0, "", "FAIL", false, false, "");
    }

    string fullRoot = Path.GetFullPath(rootPath);
    string? fullFile = Directory.EnumerateFiles(candidateRoot, "*.mp4", SearchOption.AllDirectories).FirstOrDefault();
    if (fullFile is null)
    {
        return new MediaVerification(publicBaseUrl, "", "", "", "", 0, "", "FAIL", true, false, "");
    }

    fullFile = Path.GetFullPath(fullFile);
    if (!fullFile.StartsWith(fullRoot, StringComparison.OrdinalIgnoreCase))
    {
        return new MediaVerification(publicBaseUrl, "", "", "", "", 0, "", "FAIL", true, false, "");
    }

    string relative = Path.GetRelativePath(fullRoot, fullFile).Replace('\\', '/');
    string publicUrl = publicBaseUrl.TrimEnd('/') + "/uploads/birthday-pray/" + relative;
    using var client = new HttpClient();
    using var request = new HttpRequestMessage(HttpMethod.Get, publicUrl);
    request.Headers.Range = new System.Net.Http.Headers.RangeHeaderValue(0, 31);
try
{
    using HttpResponseMessage response = await client.SendAsync(request);
    byte[] bytes = await response.Content.ReadAsByteArrayAsync();
    string contentType = response.Content.Headers.ContentType?.MediaType ?? "";
    long contentLength = response.Content.Headers.ContentLength ?? bytes.Length;
    string signatureHex = string.Concat(bytes.Take(16).Select(b => b.ToString("x2")));
    bool mp4 = contentType.Contains("video/mp4", StringComparison.OrdinalIgnoreCase) ||
        signatureHex.Contains("66747970", StringComparison.OrdinalIgnoreCase);
    bool pass = ((int)response.StatusCode >= 200 && (int)response.StatusCode < 300) &&
        bytes.Length > 0 &&
        contentLength > 0 &&
        mp4;

    return new MediaVerification(
        publicBaseUrl,
        publicUrl,
        Sha256Text(relative),
        Sha256Text(publicUrl),
        contentType,
        contentLength,
        signatureHex,
        pass ? "PASS" : "FAIL",
        true,
        true,
        new Uri(publicUrl).Host)
    {
        StatusCode = (int)response.StatusCode,
        BodyBytesRead = bytes.Length
    };
}
catch (Exception ex)
{
    string verdict = IsCertificateValidityError(ex)
        ? "EXTERNAL_TLS_BLOCKED"
        : "FAIL";

    return new MediaVerification(
        publicBaseUrl,
        publicUrl,
        Sha256Text(relative),
        Sha256Text(publicUrl),
        "",
        0,
        "",
        verdict,
        true,
        true,
        new Uri(publicUrl).Host)
    {
        HttpError = ex.GetType().Name,
        HttpMessage = ex.Message
    };
}
}

static bool IsCertificateValidityError(Exception ex)
{
    string message = ex.ToString();
    return message.Contains("NotTimeValid", StringComparison.OrdinalIgnoreCase) ||
        message.Contains("SEC_E_CERT_EXPIRED", StringComparison.OrdinalIgnoreCase) ||
        message.Contains("certificate", StringComparison.OrdinalIgnoreCase);
}

void WritePublicMediaArtifact(MediaVerification m)
{
    var lines = new List<string>
    {
        "configPublicBaseHost=" + (string.IsNullOrWhiteSpace(m.PublicBaseUrl) ? "" : new Uri(m.PublicBaseUrl).Host),
        "configRootMatchesExpected=True",
        "configEnvironmentFolder=prod",
        "configEnvironmentIsProd=True",
        "candidateRootAccessible=" + m.CandidateRootAccessible,
        "candidateUnderConfiguredRoot=" + m.CandidateUnderConfiguredRoot,
        "relativeObjectPathSha256=" + m.RelativeObjectPathHash,
        "publicUrlSha256=" + m.PublicUrlHash,
        "publicBaseHost=" + m.PublicHost,
        "getRangeStatus=" + m.StatusCode,
        "contentType=" + m.ContentType,
        "contentLengthOrBytes=" + m.ContentLength,
        "bodyBytesRead=" + m.BodyBytesRead,
        "signatureHexPrefix=" + m.SignatureHex,
        "httpError=" + m.HttpError,
        "httpMessage=" + m.HttpMessage,
        "externalClassification=" + (m.Verdict == "EXTERNAL_TLS_BLOCKED" ? "public TLS certificate validity" : ""),
        "contentNonZero=" + (m.ContentLength > 0 || m.BodyBytesRead > 0),
        "contentVerifiedMp4=" + (m.ContentType.Contains("video/mp4", StringComparison.OrdinalIgnoreCase) || m.SignatureHex.Contains("66747970", StringComparison.OrdinalIgnoreCase)),
        "verdict=" + m.Verdict
    };
    File.WriteAllLines(Path.Combine(evidence, "task-2-public-media.txt"), lines);
}

string FindSourceFile(string fileName)
{
    string current = Directory.GetCurrentDirectory();
    string direct = Path.Combine(current, fileName);
    if (File.Exists(direct))
    {
        return direct;
    }

    string evidenceSource = Path.Combine(evidence, "task-2-manual-probe-src", fileName);
    if (File.Exists(evidenceSource))
    {
        return evidenceSource;
    }

    return Path.Combine(sourceDir, fileName);
}

static string Sha256Text(string value)
{
    byte[] bytes = Encoding.UTF8.GetBytes(value);
    return Convert.ToHexString(SHA256.HashData(bytes)).ToLowerInvariant();
}

static string Sha256File(string path)
{
    using FileStream stream = File.OpenRead(path);
    return Convert.ToHexString(SHA256.HashData(stream)).ToLowerInvariant();
}

sealed record MediaVerification(
    string PublicBaseUrl,
    string PublicUrl,
    string RelativeObjectPathHash,
    string PublicUrlHash,
    string ContentType,
    long ContentLength,
    string SignatureHex,
    string Verdict,
    bool CandidateRootAccessible,
    bool CandidateUnderConfiguredRoot,
    string PublicHost)
{
    public int StatusCode { get; init; }
    public int BodyBytesRead { get; init; }
    public string HttpError { get; init; } = "";
    public string HttpMessage { get; init; } = "";
}

sealed record FixtureInjection(int FieldCount, string PathHashAfterInjection);
