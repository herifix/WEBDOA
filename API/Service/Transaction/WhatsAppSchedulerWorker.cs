using API.Repository.Master;
using API.Service;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using System.Data;

namespace API.Service.Transaction
{
    public class WhatsAppSchedulerWorker : BackgroundService
    {
        private readonly IServiceScopeFactory scopeFactory;
        private readonly ILogger<WhatsAppSchedulerWorker> logger;
        private readonly DatabaseVersioningReadiness databaseVersioningReadiness;

        public WhatsAppSchedulerWorker(
            IServiceScopeFactory scopeFactory,
            ILogger<WhatsAppSchedulerWorker> logger,
            DatabaseVersioningReadiness databaseVersioningReadiness)
        {
            this.scopeFactory = scopeFactory;
            this.logger = logger;
            this.databaseVersioningReadiness = databaseVersioningReadiness;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    if (!databaseVersioningReadiness.IsReady)
                    {
                        logger.LogInformation("WhatsApp birthday scheduler readiness skip: database versioning is not ready.");
                    }
                    else
                    {
                        await ProcessPendingDispatches();
                    }
                }
                catch (Exception ex)
                {
                    logger.LogError(ex, "Error while processing WhatsApp birthday scheduler.");
                }

                await Task.Delay(TimeSpan.FromMinutes(1), stoppingToken);
            }
        }

        private async Task ProcessPendingDispatches()
        {
            using var scope = scopeFactory.CreateScope();
            var conn = scope.ServiceProvider.GetRequiredService<IDbConnection>();
            var repo = scope.ServiceProvider.GetRequiredService<RepoWhatsAppSchedule>();
            var birthdayPrayService = scope.ServiceProvider.GetRequiredService<ServiceTRBirthdayPray>();

            if (conn.State == ConnectionState.Closed)
            {
                conn.Open();
            }

            try
            {
                var dueItems = repo.GetDueDispatches(DateTime.Now, conn);
                foreach (var item in dueItems)
                {
                    bool success = false;
                    string responseMessage;

                    try
                    {
                        var result = await birthdayPrayService.SendScheduledWhatsApp(
                            item.id_donatur,
                            item.birthdayDate.Year);
                        success = result.success;
                        responseMessage = result.message ?? "";
                    }
                    catch (Exception ex)
                    {
                        responseMessage = ex.Message;
                        logger.LogError(ex, "Failed to dispatch WhatsApp for TRBirthdayPray #{Id}.", item.id_TRBirthdayPray);
                    }

                    if (conn.State == ConnectionState.Closed)
                    {
                        conn.Open();
                    }

                    repo.InsertSendLog(
                        item.id_TRBirthdayPray,
                        item.birthdayDate,
                        success,
                        responseMessage,
                        conn);
                }
            }
            finally
            {
                if (conn.State == ConnectionState.Open)
                {
                    conn.Close();
                }
            }
        }
    }
}
