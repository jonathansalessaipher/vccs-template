using System.Threading.Tasks;

namespace VCCS.Domain.UoW
{
    public interface IUnitOfWork
    {
        void BeginTransaction();
        Task<bool> Commit();
        Task Rollback();
    }
}
