using System.Data;
using System.Data.SqlClient;

namespace VCCS.Infra.Data.Context
{
    public class DBContext : IDBContextOpr
    {
        private IDbConnection _connection;
        private IDbTransaction _transaction;

        public DBContext(string connectionString)
        {
            _connection = new SqlConnection(connectionString);
        }

        public IDbConnection Connection => _connection;

        public IDbTransaction Transaction { get => _transaction; set => _transaction = value; }

        public void Dispose() => _connection?.Dispose();
    }
}
