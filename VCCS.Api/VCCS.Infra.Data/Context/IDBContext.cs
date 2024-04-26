using System;
using System.Data;

namespace VCCS.Infra.Data.Context
{
    public interface IDBContext : IDisposable
    {
        IDbConnection Connection { get; }
        IDbTransaction Transaction { get; set; }
    }
}
