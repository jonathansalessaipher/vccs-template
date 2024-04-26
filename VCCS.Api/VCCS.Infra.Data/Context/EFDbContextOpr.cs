using Microsoft.EntityFrameworkCore;

namespace VCCS.Infra.Data.Context
{
    public class EFDbContextOpr : DbContext
    {
        public EFDbContextOpr(DbContextOptions<EFDbContextOpr> options) : base(options)
        {
        }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);
        }
    }
}
