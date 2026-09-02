using API.Repository.global;
using API.Service.Transaction;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Text.Json;

namespace API.Controllers
{
    [ApiController]
    [Route("")]
    [Route("api")]
    public class ControllerTRBirthdayPray : Controller
    {
        private readonly ServiceTRBirthdayPray service;

        public ControllerTRBirthdayPray(ServiceTRBirthdayPray service)
        {
            this.service = service;
        }

        [HttpGet]
        [Route("Transaction/TRBirthdayPray/GetDashboard")]
        public ResponseData<List<ResponseModelDashboardBirthday>> GetDashboard([FromQuery] DateTime? tgl = null)
        {
            DateTime anchorDate = (tgl ?? DateTime.Today).Date;
            return service.GetUpcomingBirthdayDashboard(anchorDate);
        }

        [HttpGet]
        [Route("Transaction/TRBirthdayPray/UpcomingBirthdayByTgl")]
        public ResponseData<List<ResponseModelDashboardBirthday>> UpcomingBirthdayByTgl([FromQuery] DateTime tgl)
        {
            return service.GetUpcomingBirthdayByDate(tgl.Date);
        }

        [HttpGet]
        [Route("Transaction/TRBirthdayPray/GetDateStatuses")]
        public ResponseData<List<ResponseModelTRBirthdayPrayDateStatus>> GetDateStatuses()
        {
            return service.GetDateStatuses();
        }

        [HttpGet]
        [Route("Transaction/TRBirthdayPray/GetDataByDonatur")]
        public ResponseData<ResponseModelTRBirthdayPray> GetDataByDonatur([FromQuery] long idDonatur, [FromQuery] int? year = null)
        {
            return service.GetDataByDonatur(idDonatur, year);
        }

        [HttpGet]
        [Route("Transaction/TRBirthdayPray/GetHistoryByDonatur")]
        public ResponseData<List<ResponseModelTRBirthdayPrayHistory>> GetHistoryByDonatur([FromQuery] long idDonatur)
        {
            return service.GetHistoryByDonatur(idDonatur);
        }

        [HttpPut]
        [Route("Transaction/TRBirthdayPray/Save")]
        public ResponseData<long> Save([FromForm] RequestSaveTRBirthdayPray bodyRequest)
        {
            return service.Save(bodyRequest);
        }

        [HttpPut]
        [Route("Transaction/TRBirthdayPray/SaveVoice")]
        public ResponseData<long> SaveVoice([FromForm] RequestSaveTRBirthdayPrayVoice bodyRequest)
        {
            return service.SaveVoice(bodyRequest);
        }

        [HttpPut]
        [Route("Transaction/TRBirthdayPray/SaveVoiceFFmpeg")]
        public ResponseData<long> SaveVoiceFFmpeg([FromForm] RequestSaveTRBirthdayPrayVoice bodyRequest)
        {
            return service.SaveVoiceFFmpeg(bodyRequest);
        }
 
        [HttpPost]
        [Route("Transaction/TRBirthdayPray/SendWhatsApp")]
        public async Task<ResponseData<object>> SendWhatsApp([FromBody] RequestSendWhatsApp bodyRequest)
        {
            return await service.SendWhatsApp(bodyRequest.idDonatur, bodyRequest.year);
        }

        [HttpPost]
        [Route("Transaction/TRBirthdayPray/DebugSendWhatsApp")]
        public async Task<ResponseData<object>> DebugSendWhatsApp([FromBody] RequestSendWhatsApp bodyRequest)
        {
            return await service.DebugSendWhatsApp(
                bodyRequest.idDonatur,
                bodyRequest.year,
                bodyRequest.runLive,
                bodyRequest.includeFollowUpVoice);
        }

        [HttpGet]
        [Route("Transaction/TRBirthdayPray/SendNextTodayWhatsApp")]
        public async Task<ResponseData<ResponseModelTRBirthdayPrayAutoSendResult>> SendNextTodayWhatsApp()
        {
            return await service.SendNextTodayCompleteUnsentWhatsApp();
        }

        [HttpPost]
        [Route("Transaction/TRBirthdayPray/SendTestWhatsAppText")]
        public async Task<ResponseData<object>> SendTestWhatsAppText([FromBody] RequestSendWhatsApp bodyRequest)
        {
            return await service.SendTestWhatsAppText(
                bodyRequest.idDonatur,
                bodyRequest.year,
                bodyRequest.messageText,
                bodyRequest.runLive);
        }

        [HttpPost]
        [Route("Transaction/TRBirthdayPray/SendTestWhatsAppVoice")]
        public async Task<ResponseData<object>> SendTestWhatsAppVoice([FromBody] RequestSendWhatsApp bodyRequest)
        {
            return await service.SendTestWhatsAppVoice(bodyRequest.idDonatur, bodyRequest.year, bodyRequest.runLive);
        }

        [HttpGet]
        [Route("Transaction/TRBirthdayPray/GetPhoneNumbers")]
        public async Task<ResponseData<object>> GetPhoneNumbers()
        {
            return await service.GetWhatsAppPhoneNumbers();
        }

        [HttpGet]
        [Route("Transaction/TRBirthdayPray/GetMediaDebugInfo")]
        public ResponseData<ResponseModelTRBirthdayPrayMediaDebug> GetMediaDebugInfo([FromQuery] long idDonatur, [FromQuery] int? year = null)
        {
            return service.GetMediaDebugInfo(idDonatur, year);
        }

        [HttpGet]
        [Route("Transaction/TRBirthdayPray/GetWhatsAppDeliveryStatus")]
        public async Task<ResponseData<object>> GetWhatsAppDeliveryStatus(
            [FromQuery] long idDonatur,
            [FromQuery] int? year = null,
            [FromQuery] bool debug = false)
        {
            return await service.GetWhatsAppDeliveryStatus(idDonatur, year, debug);
        }

        [AllowAnonymous]
        [HttpPost]
        [Route("Transaction/TRBirthdayPray/WhatsAppDeliveryWebhook")]
        public ActionResult<ResponseData<object>> ReceiveWhatsAppDeliveryWebhook(
            [FromQuery] string? token,
            [FromBody] JsonElement payload)
        {
            ResponseData<object> response = service.ReceiveWhatsAppDeliveryWebhook(token, payload);
            if (response.success)
            {
                return Ok(response);
            }

            return response.message.StartsWith("Webhook token", StringComparison.OrdinalIgnoreCase) ||
                response.message.StartsWith("WhatsAppGateway:WebhookToken", StringComparison.OrdinalIgnoreCase)
                ? Unauthorized(response)
                : BadRequest(response);
        }
    }
}
