using API.Repository.global;
using API.Service.Transaction;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers
{
    [ApiController]
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
    }
}
