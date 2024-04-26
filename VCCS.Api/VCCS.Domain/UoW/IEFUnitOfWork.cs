using System;
using System.Threading.Tasks;

namespace VCCS.Domain.UoW
{
    public interface IEFUnitOfWork : IDisposable
    {
        int Commit();
        Task<int> CommitAsync();
    }
}
