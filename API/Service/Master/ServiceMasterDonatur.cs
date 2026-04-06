using API.Repository.global;
using Dapper;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using System;
using System.Data;
using static System.Net.Mime.MediaTypeNames;

namespace API.Service.Master
{
    public class ServiceMasterDonatur
    {

        private readonly IDbConnection conn;
        private readonly RepoMasterDonatur donaturfunc;
        private readonly IWebHostEnvironment _env;

        public ServiceMasterDonatur(IDbConnection conn, RepoMasterDonatur repo, IWebHostEnvironment env)
        {
            this.conn = conn;
            this.donaturfunc = repo;
            _env = env;
        }
    }
}