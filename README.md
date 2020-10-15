# GitHub Action for deploying updates to Azure Database for MySQL server

With the Azure MySQL Action for GitHub, you can automate your workflow to deploy updates to [Azure Database for MySQL server](https://azure.microsoft.com/en-in/services/mysql/).

Get started today with a [free Azure account](https://azure.com/free/open-source)!

This repository contains GitHub Action for [Azure database for MySQL server](https://github.com/Azure/mysql) to deploy . 

The action uses Connection String for authentication and SQL scripts to deploy to your MySQL database.

If you are looking for more Github Actions to deploy code or a customized image into an Azure Webapp or a Kubernetes service, consider using [Azure Actions](https://github.com/Azure/actions).

The definition of this Github Action is in [action.yml](https://github.com/Azure/mysql/blob/master/action.yml).

# End-to-End Sample Workflow

## Dependencies on other Github Actions

* Authenticate using [Azure Login](https://github.com/Azure/login)

For the action to run, the IP Address of the GitHub Action runner (automation agent) must be added to the 'Allowed IP Addresses' by setting [MySQL server firewall rules](https://docs.microsoft.com/en-us/azure/mysql/howto-manage-firewall-using-portal) in Azure.  Without the firewall rules, the runner cannot communicate with Azure database for MySQL.

By default, the action would auto-detect the IP Address of the runner to automatically add firewall exception rule. These firewall rules will be deleted after the action executes.

However, this auto-provisioning of firewall rules needs a pre-req that the workflow includes an `azure/login@v1` action before the `azure/mysql-action@v1` action. Also, the service principal used in the Azure login action needs to have elevated permissions, i.e. membership in SQL Security Manager RBAC role, or a similarly high permission in the database to create the firewall rule.

Alternatively, if enough permissions are not granted on the service principal or login action is not included, then the firewall rules have to be explicitly managed by user using CLI/PS scripts.

## Create an Azure database for MySQL server and deploy using GitHub Actions
1. Follow the tutorial [Azure Database for MySQL server Quickstart](https://docs.microsoft.com/en-us/azure/mysql/quickstart-create-mysql-server-database-using-azure-portal)
2. Copy the MySQL-on-Azure.yml template from [starter templates](https://github.com/Azure/actions-workflow-samples/tree/master/Database) and paste the template contents into `.github/workflows/` within your project repository as workflow.yml.
3. Change `server-name` to your Azure MySQL Server name.
4. Commit and push your project to GitHub repository, you should see a new GitHub Action initiated in **Actions** tab.

## Configure GitHub Secrets with Azure Credentials and MySQL Connection Strings
For using any sensitive data/secrets like Azure Service Principal or MySQL Connection strings within an Action, add them as [secrets](https://help.github.com/en/github/automating-your-workflow-with-github-actions/virtual-environments-for-github-actions#creating-and-using-secrets-encrypted-variables) in the GitHub repository and then use them in the workflow.

Follow the steps to configure the secret:
  * Define a new secret under your repository **Settings** > **Secrets** > **Add a new secret** menu
  * Paste the contents of the Secret (Example: Connection String) as Value
  * Also, copy the connection string from Azure MySQL DB which is under **Connection strings > ADO.NET** and of the format: ```Server={your_server}; Port=3306; Database={your_database}; Uid={your_user}; Pwd={your_password}; SslMode=Preferred;```(Database is optional)
  * For Azure credentials, paste the output of the below [az cli](https://docs.microsoft.com/en-us/cli/azure/?view=azure-cli-latest) command as the value of secret variable, for example 'AZURE_CREDENTIALS'
```bash  

   az ad sp create-for-rbac --name {server-name} --role contributor \
                            --scopes /subscriptions/{subscription-id}/resourceGroups/{resource-group} \
                            --sdk-auth
                            
  # Replace {subscription-id}, {resource-group} and {server-name} with the subscription, resource group and name of the Azure MySQL server
  
  # The command should output a JSON object similar to this:

  {
    "clientId": "<GUID>",
    "clientSecret": "<GUID>",
    "subscriptionId": "<GUID>",
    "tenantId": "<GUID>",
    (...)
  }
  
```
Please refer [ConnectionString properties](https://docs.microsoft.com/dotnet/api/system.data.sqlclient.sqlconnection.connectionstring?redirectedfrom=MSDN&view=dotnet-plat-ext-3.1#remarks) for handling special characters in connection string.
 
### Sample workflow to deploy to an Azure database for MySQL server

```yaml
# .github/workflows/mysql-deploy.yml
on: [push]

jobs:
  build:
    runs-on: windows-latest
    steps:
    - uses: actions/checkout@v1
    - uses: azure/login@v1
      with:
        creds: ${{ secrets.AZURE_CREDENTIALS }}
    - uses: azure/mysql@v1
      with:
        server-name: REPLACE_THIS_WITH_YOUR_MYSQL_SERVER_NAME
        connection-string: ${{ secrets.AZURE_MYSQL_CONNECTION_STRING }}
        sql-file: './sqlFile.sql'
 ```


# Contributing

This project welcomes contributions and suggestions.  Most contributions require you to agree to a
Contributor License Agreement (CLA) declaring that you have the right to, and actually do, grant us
the rights to use your contribution. For details, visit https://cla.opensource.microsoft.com.

When you submit a pull request, a CLA bot will automatically determine whether you need to provide
a CLA and decorate the PR appropriately (e.g., status check, comment). Simply follow the instructions
provided by the bot. You will only need to do this once across all repos using our CLA.

This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/).
For more information see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or
contact [opencode@microsoft.com](mailto:opencode@microsoft.com) with any additional questions or comments.
