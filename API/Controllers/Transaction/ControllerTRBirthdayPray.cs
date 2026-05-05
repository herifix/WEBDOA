using API.Repository.global;
using API.Service.Transaction;
using Microsoft.AspNetCore.Mvc;

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
            return service.GetUpcomingBirthdayDashboard((tgl ?? DateTime.Today).Date);
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
 
        [HttpPost]
        [Route("Transaction/TRBirthdayPray/SendWhatsApp")]
        public async Task<ResponseData<string>> SendWhatsApp([FromBody] RequestSendWhatsApp bodyRequest)
        {
            return await service.SendWhatsApp(bodyRequest.idDonatur, bodyRequest.year);
        }

        [HttpPost]
        [Route("Transaction/TRBirthdayPray/SendTestWhatsAppText")]
        public async Task<ResponseData<string>> SendTestWhatsAppText([FromBody] RequestSendWhatsApp bodyRequest)
        {
            return await service.SendTestWhatsAppText(bodyRequest.idDonatur, bodyRequest.year);
        }

        [HttpPost]
        [Route("Transaction/TRBirthdayPray/SendTestWhatsAppVoice")]
        public async Task<ResponseData<string>> SendTestWhatsAppVoice([FromBody] RequestSendWhatsApp bodyRequest)
        {
            return await service.SendTestWhatsAppVoice(bodyRequest.idDonatur, bodyRequest.year);
        }

        [HttpGet]
        [Route("Transaction/TRBirthdayPray/GetPhoneNumbers")]
        public async Task<ResponseData<string>> GetPhoneNumbers()
        {
            return await service.GetWhatsAppPhoneNumbers();
        }

        [HttpGet]
        [Route("Transaction/TRBirthdayPray/GetMediaDebugInfo")]
        public ResponseData<ResponseModelTRBirthdayPrayMediaDebug> GetMediaDebugInfo([FromQuery] long idDonatur, [FromQuery] int? year = null)
        {
            return service.GetMediaDebugInfo(idDonatur, year);
        }
    }
}
