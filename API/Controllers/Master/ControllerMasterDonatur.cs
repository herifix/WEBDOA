using API.Repository.global;
using API.Service.Master;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using System.Data;

namespace API.Controllers
{
    //[ApiExplorerSettings(IgnoreApi = true)] // Hide untuk swagger
    [ApiController]
    [Route("api")]
    public class ControllerMasterDonatur : Controller
    {
        private readonly IDbConnection conn;
        private readonly ServiceMasterDonatur DonaturService;

        public ControllerMasterDonatur(IDbConnection db, ServiceMasterDonatur donaturService)
        {
            this.conn = db;
            this.DonaturService = donaturService;
        }

        private readonly RepoMasterDonatur repo = new RepoMasterDonatur();

        //[Authorize] // ✅ butuh token
        [HttpPut]
        [Route("Master/Donatur/Create")]
        public ResponseData<int> Create([FromForm] RequestCreateMasterDonatur bodyRequest)
        {
            return DonaturService.CreateData(bodyRequest);
        }

        //[Authorize] // ✅ butuh token
        [HttpPut]
        [Route("Master/Donatur/Update")]
        public ResponseData<int> Update([FromForm] RequestUpdateMasterDonatur bodyRequest)
        {
            return DonaturService.UpdateData(bodyRequest);
        }

        //[Authorize] // ✅ butuh token
        [HttpPut]
        [Route("Master/Donatur/Delete/{id}")]
        public ResponseData<int> Delete(long id)
        {
            return DonaturService.DeleteData(id);
        }

        //[Authorize] // ✅ butuh token
        [HttpGet]
        [Route("Master/Donatur/GetDataById")]
        public ResponseData<ResponseModeMasterDonatur> GetDataById(long id)
        {
            return repo.GetDataById(id, conn);
        }

        //[Authorize] // ✅ butuh token
        [HttpGet]
        [Route("Master/Donatur/GetDataAll")]
        public PagedResponse<ResponseModeMasterDonatur> GetDataAll(
            [FromQuery] int PageNumber = 1,
            [FromQuery] int PageSize = 15,
            [FromQuery] string Search = ""
        )
        {
            var request = new RequestGetAllMasterDonatur
            {
                PageNumber = PageNumber,
                PageSize = PageSize,
                Search = Search ?? ""
            };
            return repo.GetAll(request, conn);
        }

        //[Authorize] // ✅ butuh token
        [HttpGet]
        [Route("Master/Donatur/GetDataByTgl")]
        public ResponseData<List<ResponseModeMasterDonatur>> GetDataByTgl(string Tgl)
        {
            return repo.GetDataByTgl(Tgl, conn);
        }
    }
}
