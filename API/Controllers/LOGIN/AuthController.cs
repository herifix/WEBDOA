using API.Repository.global;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using System.Data;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Claim = System.Security.Claims.Claim;

namespace MyApp.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IConfiguration _config;
    private readonly IDbConnection conn;
    private readonly globalFunctionOutConn funcoutconn;

    //public AuthController(IConfiguration config) => _config = config;

    public AuthController(IConfiguration config, IDbConnection DB)
    {
        _config = config;
        conn = DB;

        // ✅ INI YANG BENAR: assign ke field
        funcoutconn = new globalFunctionOutConn(conn);
        // atau: this.funcoutconn = new globalFunctionOutConn(conn);
    }

    //#if !DEBUG
    [ApiExplorerSettings(IgnoreApi = true)]
    //#endif
    [HttpGet("GetlistPT")]
    public IActionResult GetListPT()
    {
        var data = funcoutconn.GetAllPT();
        return Ok(data);
    }

    [HttpPost("login")]
    public IActionResult Login([FromBody] RequestLogin req)
    {
        GlobalProcedure proc = new GlobalProcedure();
        // ✅ Contoh sederhana (nanti ganti cek ke DB)
        //if (req.Username != Variables.uidDB || req.Password != Variables.passDB)
        //    return Unauthorized(new { message = "Username/password salah" });

        globalFunction globalFunction = new globalFunction(conn);

        if (!globalFunction.IsUserExists(req.Userid,req.Password,req.Userpt))
            return Unauthorized(new { message = "Username/password salah" });

        ResponseLogin datauser = globalFunction.GetDataUser(req.Userid, req.Userpt);
        //ResponsePt ptinfo = globalFunction.GetDataPt(req.Userpt);

        proc.Addlog(new RequestLog
        {
            Userid = datauser.Userid,
            Jenistr = "GETTOKENAPI",
            Notr = "-",
            FromModul = "API",
            Act = "LOGIN",
            Ket = $"",
            Kodearea = "MJKKB"
        }, conn);


        var jwt = _config.GetSection("Jwt");
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwt["Key"]!));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new Claim(JwtRegisteredClaimNames.Sub, req.Userid),
            new Claim(ClaimTypes.Name, datauser.Username),
            new Claim(ClaimTypes.Role, "User"),
            new Claim("pt", datauser.Userpt),
            new Claim("userlvl", datauser.Userlvl),
            new Claim("gantiKunci", datauser.GantiKunci ? "1" : "0")

        };

        var token = new JwtSecurityToken(
            issuer: jwt["Issuer"],
            audience: jwt["Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(int.Parse(jwt["ExpireMinutes"]!)),
            signingCredentials: creds
        );

        return Ok(new
        {
            access_token = new JwtSecurityTokenHandler().WriteToken(token)
        });
    }

    [HttpGet("menu")]
    public ActionResult<ResponseData<List<ResponseModelMenuTree>>> GetMenu([FromQuery] string userid, [FromQuery] string pt)
    {
        globalFunction globalFunction = new globalFunction(conn);

        try
        {
            var data = globalFunction.GetSidebarMenu(userid ?? "", pt ?? "");
            return Ok(new ResponseData<List<ResponseModelMenuTree>>
            {
                success = true,
                message = data.Count > 0 ? "OK" : "Data not found",
                data = data
            });
        }
        catch (Exception ex)
        {
            return Ok(new ResponseData<List<ResponseModelMenuTree>>
            {
                success = false,
                message = ex.Message,
                data = new List<ResponseModelMenuTree>()
            });
        }
    }
}

