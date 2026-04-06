using Microsoft.EntityFrameworkCore;


namespace API.Repository.global
{
    public class Variables
    {
        public static string servername = "heri-int";

        public const string userarea = "MJKKB";
        public const string uidDB = "sa";
        public const string passDB = "intersoft";
        public const string mainDB = "GKI2013IN";
        public const string DBInventory = "InventoryGKI"; // hanya ini yang dirubah saat compile untuk akses DB Inventory (yang lain tetap ke GKI2013IN)
    }

    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options)
            : base(options)
        {
        }
    }


}
