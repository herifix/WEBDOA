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

        iRepoMasterDonatur repo = new RepoMasterDonatur();

        //[Authorize] // ✅ butuh token
        [HttpGet]
        [Route("Master/Donatur/GetDataByTgl")]
        public ResponseData<List<ResponseModeMasterDonatur>> GetDataByTgl(string Tgl)
        {
            return repo.GetDataByTgl(Tgl, conn);
        }
    }
}