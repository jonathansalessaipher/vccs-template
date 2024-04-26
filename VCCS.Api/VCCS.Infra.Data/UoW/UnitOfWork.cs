using System;
using System.Threading.Tasks;
using VCCS.Domain.UoW;
using VCCS.Infra.Data.Context;

namespace VCCS.Infra.Data.UoW
{
    public class UnitOfWork : IUnitOfWorkOpr
    {
        private readonly IDBContext _dataContext;

        public UnitOfWork(IDBContext dbContext)
        {
            _dataContext = dbContext;
        }

        public void BeginTransaction()
        {
            _dataContext.Connection.Open();
            _dataContext.Transaction = _dataContext.Connection.BeginTransaction();
        }

        public Task<bool> Commit()
        {
            bool success;

            try
            {
                _dataContext.Transaction.Commit();
                success = true;
            }
            catch (Exception)
            {
                _dataContext.Transaction.Rollback();
                success = false;
            }

            Dispose();

            return Task.FromResult(success);
        }

        public Task Rollback()
        {
            _dataContext.Transaction?.Rollback();

            Dispose();

            return Task.CompletedTask;
        }

        public void Dispose() => _dataContext.Transaction?.Dispose();
    }
}
