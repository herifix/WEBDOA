using API.Repository.Master;
using API.Repository.global;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using System.Data;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;

namespace API.Service.Transaction
{
    public class WhatsAppSchedulerWorker : BackgroundService
    {
        private readonly IServiceScopeFactory scopeFactory;
        private readonly IConfiguration configuration;
        private readonly ILogger<WhatsAppSchedulerWorker> logger;

        public WhatsAppSchedulerWorker(
            IServiceScopeFactory scopeFactory,
            IConfiguration configuration,
            ILogger<WhatsAppSchedulerWorker> logger)
        {
            this.scopeFactory = scopeFactory;
            this.configuration = configuration;
            this.logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await ProcessPendingDispatches(stoppingToken);
                }
                catch (Exception ex)
                {
                    logger.LogError(ex, "Error while processing WhatsApp birthday scheduler.");
                }

                await Task.Delay(TimeSpan.FromMinutes(1), stoppingToken);
            }
        }

        private async Task ProcessPendingDispatches(CancellationToken stoppingToken)
        {
            using var scope = scopeFactory.CreateScope();
            var conn = scope.ServiceProvider.GetRequiredService<IDbConnection>();
            var repo = scope.ServiceProvider.GetRequiredService<RepoWhatsAppSchedule>();

            if (conn.State == ConnectionState.Closed)
                conn.Open();

            try
            {
                var dueItems = repo.GetDueDispatches(DateTime.Now, conn);
                if (dueItems.Count == 0)
                {
                    return;
                }

                foreach (var item in dueItems)
                {
                    bool success = false;
                    string responseMessage = "";

                    try
                    {
                        var result = await SendWhatsAppAsync(item, stoppingToken);
                        success = result.success;
                        responseMessage = result.message;
                    }
                    catch (Exception ex)
                    {
                        responseMessage = ex.Message;
                        logger.LogError(ex, "Failed to dispatch WhatsApp for TRBirthdayPray #{Id}.", item.id_TRBirthdayPray);
                    }

                    repo.InsertSendLog(
                        item.id_TRBirthdayPray,
                        item.birthdayDate,
                        success,
                        responseMessage,
                        conn
                    );
                }
            }
            finally
            {
                if (conn.State == ConnectionState.Open)
                    conn.Close();
            }
        }

        private async Task<(bool success, string message)> SendWhatsAppAsync(
            ResponseModelBirthdayPrayDispatchItem item,
            CancellationToken cancellationToken)
        {
            string gatewayUrl = configuration["WhatsAppGateway:Url"] ?? "";
            string gatewayToken = configuration["WhatsAppGateway:Token"] ?? "";
            string publicBaseUrl = configuration["WhatsAppGateway:PublicBaseUrl"] ?? "";

            if (string.IsNullOrWhiteSpace(gatewayUrl))
            {
                return (false, "WhatsApp gateway URL belum diatur.");
            }

            string audioUrl = "";
            if (!string.IsNullOrWhiteSpace(item.pathPesanSuara))
            {
                audioUrl = BuildAbsoluteAudioUrl(publicBaseUrl, item.pathPesanSuara);
            }

            using var httpClient = new HttpClient();
            if (!string.IsNullOrWhiteSpace(gatewayToken))
            {
                httpClient.DefaultRequestHeaders.Authorization =
                    new AuthenticationHeaderValue("Bearer", gatewayToken);
            }

            var payload = new
            {
                fromPhone = item.noHPPendoa,
                toPhone = item.noHPDonatur,
                donorName = item.namaDonatur,
                prayerBy = item.namaPendoa,
                birthdayDate = item.birthdayDate.ToString("yyyy-MM-dd"),
                message = item.pesan ?? "",
                audioUrl = audioUrl
            };

            using var content = new StringContent(
                JsonSerializer.Serialize(payload),
                Encoding.UTF8,
                "application/json"
            );

            using var response = await httpClient.PostAsync(gatewayUrl, content, cancellationToken);
            string body = await response.Content.ReadAsStringAsync(cancellationToken);

            if (response.IsSuccessStatusCode)
            {
                return (true, string.IsNullOrWhiteSpace(body) ? "OK" : body);
            }

            return (false, string.IsNullOrWhiteSpace(body)
                ? $"Gateway error {(int)response.StatusCode}"
                : body);
        }

        private string BuildAbsoluteAudioUrl(string publicBaseUrl, string relativePath)
        {
            if (string.IsNullOrWhiteSpace(relativePath))
                return "";

            if (Uri.TryCreate(relativePath, UriKind.Absolute, out var absoluteUri))
                return absoluteUri.ToString();

            if (string.IsNullOrWhiteSpace(publicBaseUrl))
                return relativePath.Replace("\\", "/");

            return $"{publicBaseUrl.TrimEnd('/')}/{relativePath.TrimStart('/').Replace("\\", "/")}";
        }
    }
}
