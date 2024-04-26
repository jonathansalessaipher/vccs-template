using Microsoft.EntityFrameworkCore;
using System.Threading.Tasks;
using VCCS.Domain.UoW;

namespace VCCS.Infra.Data.UoW
{
    public sealed class EFUnitOfWork : IEFUnitOfWorkOpr
    {
        private DbContext _context;

        public EFUnitOfWork(DbContext context)
        {
            _context = context;
        }

        public Task<int> CommitAsync()
        {
            return _context.SaveChangesAsync();
        }

        public int Commit()
        {
            return _context.SaveChanges();
        }

        public void Dispose()
        {
            Dispose(true);
        }

        private void Dispose(bool disposing)
        {
            if (disposing)
            {
                if (_context != null)
                {
                    _context.Dispose();
                    _context = null;
                }
            }
        }
    }
}
