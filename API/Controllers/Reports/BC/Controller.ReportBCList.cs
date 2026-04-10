using API.Repository.Reports.BC;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Data;
using System.Security.Claims;

namespace API.Controllers.Reports.BC
{
    [ApiExplorerSettings(IgnoreApi = true)]
    [ApiController]
    [Route("")]
    [Route("api")]
    public class ControllerReportBC : Controller
    {
        private readonly IDbConnection conn;
        
        RepoReportBC repo = new RepoReportBC();

        public ControllerReportBC(IDbConnection db)
        {
            conn = db;
        }

        [Authorize] // ✅ butuh token
        [HttpPost]
        [Route("Reports/BC/ListBC")]
        public List<ResponseModelListBC> ListBC(RequestModelListBC bodyrequest )
        {
            string userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            return repo.ListBC (bodyrequest, conn,userId);
        }

        [Authorize] // ✅ butuh token
        [HttpPost]
        [Route("Reports/BC/PosisiWIP")]
        public List<ResponseModelPosisisWIP> PosisiWIP(RequestModelPosisiWIP bodyrequest)
        {
            string userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            return repo.PosisiWIP(bodyrequest, conn,userId);
        }

        [Authorize] // ✅ butuh token
        [HttpPost]
        [Route("Reports/BC/MutasiBahanBaku")]
        public List<ResponseModelMutStok> MutBB(RequestModelMutStok bodyrequest)
        {
            string userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            return repo.MutasiBB(bodyrequest, conn,userId);
        }

        [Authorize] // ✅ butuh token
        [HttpPost]
        [Route("Reports/BC/MutasiFinishGood")]
        public List<ResponseModelMutStok> MutFG(RequestModelMutStok bodyrequest)
        {
            string userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            return repo.MutasiFG(bodyrequest, conn,userId);
        }

        [Authorize] // ✅ butuh token
        [HttpPost]
        [Route("Reports/BC/MutasiFinishReject")]
        public List<ResponseModelMutStok> MutReject(RequestModelMutStok bodyrequest)
        {
            string userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            return repo.MutasiReject(bodyrequest, conn, userId);
        }

        [Authorize] // ✅ butuh token
        [HttpPost]
        [Route("Reports/BC/MutasiFinishMSN")]
        public List<ResponseModelMutStok> MutMSN(RequestModelMutStok bodyrequest)
        {
            string userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            return repo.MutasiMSN(bodyrequest, conn, userId);
        }

        [Authorize] // ✅ butuh token
        [HttpPost]
        [Route("Reports/BC/HistLog")]
        public List<ResponseModelHistLog> HistLOG(RequestModelHistLog bodyrequest)
        {
            string userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            //string userPt = User.FindFirstValue("pt");

            return repo.HistLOG(bodyrequest, conn, userId);
        }
    }
}
