# Grant-SpfxApiPermissions.ps1
#
# Grants OAuth2 permission scopes to the SharePoint Online Web Client Extensibility
# principal (the SPFx runtime) so that SPFx solutions can acquire tokens for a
# custom Entra ID-protected API without requiring per-user admin consent.
#
# Based on Laura Kokkarinen's script:
# https://laurakokkarinen.com/managing-sharepoint-framework-api-permissions-with-powershell/
#
# Prerequisites: Microsoft.Graph.Applications and Microsoft.Graph.Identity.SignIns modules.
# The script will prompt to install them if missing.
#
# Usage:
#   .\Grant-SpfxApiPermissions.ps1 -ResourceAppId "<your-api-client-id>"
#   .\Grant-SpfxApiPermissions.ps1 -ResourceAppId "<your-api-client-id>" -Scopes @("user_impersonation", "other_scope")

[CmdletBinding()]
param (
    [Parameter(Mandatory = $true, HelpMessage = "Client ID of the Entra ID app registration to grant permissions for.")]
    [string]$ResourceAppId,

    [Parameter(Mandatory = $false, HelpMessage = "OAuth2 scope names to grant. Defaults to user_impersonation.")]
    [string[]]$Scopes = @("user_impersonation")
)

$spfxAppId = "08e18876-6177-487e-b8b5-cf950c1e598c" # SharePoint Online Web Client Extensibility
$resourceGrant = $null

if ($null -eq (Get-Module -ListAvailable -Name Microsoft.Graph.Applications) -or $null -eq (Get-Module -ListAvailable -Name Microsoft.Graph.Identity.SignIns)) {
    $response = Read-Host -Prompt "Running this script requires Microsoft.Graph modules that are not yet installed. Install now? (Y/N)"
    if ($response -eq "Y") {
        if ($null -eq (Get-Module -ListAvailable -Name Microsoft.Graph.Applications)) {
            Install-Module -Name Microsoft.Graph.Applications -Scope CurrentUser -Force -AllowClobber
        }
        if ($null -eq (Get-Module -ListAvailable -Name Microsoft.Graph.Identity.SignIns)) {
            Install-Module -Name Microsoft.Graph.Identity.SignIns -Scope CurrentUser -Force -AllowClobber
        }
    }
    else {
        Write-Host "The script cannot continue without the Microsoft.Graph modules. Exiting."
        exit
    }
}

Connect-MgGraph -Scopes "Application.ReadWrite.All", "Directory.ReadWrite.All" -NoWelcome

try {
    # Get the SPFx Service Principal
    $spfx = Get-MgServicePrincipal -Filter "appid eq '$spfxAppId'" -ErrorAction Stop

    # Get the target API service principal (required to identify the object ID)
    $resource = Get-MgServicePrincipal -Filter "appid eq '$ResourceAppId'" -ErrorAction Stop

    foreach ($scope in $Scopes) {
        # Get the scopes currently granted for the target API
        $spfxGrants = Get-MgServicePrincipalOauth2PermissionGrant -ServicePrincipalId $spfx.Id -ErrorAction Stop
        foreach ($spfxGrant in $spfxGrants) {
            if ($spfxGrant.ResourceId -eq $resource.Id) {
                $resourceGrant = $spfxGrant
                break
            }
        }

        if ($null -ne $resourceGrant) {
            if ($resourceGrant.Scope | Select-String $scope -Quiet) {
                Write-Host "Scope $scope has already been granted for app $($resource.DisplayName) ($ResourceAppId)."
                continue
            }
            # Scope not yet present — append and update
            $resourceGrant.Scope += " $scope"
            Update-MgOauth2PermissionGrant -OAuth2PermissionGrantId $resourceGrant.Id -Scope $resourceGrant.Scope -ErrorAction Stop | Out-Null
        }
        else {
            # No grant exists yet — create one
            $params = @{
                "clientId"    = $spfx.Id
                "consentType" = "AllPrincipals"
                "resourceId"  = $resource.Id
                "scope"       = $scope
            }
            New-MgOauth2PermissionGrant -BodyParameter $params -ErrorAction Stop | Out-Null
        }

        Write-Host "Scope $scope granted for app $($resource.DisplayName) ($ResourceAppId)."
    }
}
catch {
    Write-Host "The following error occurred: $($_.Exception.Message)" -ForegroundColor Red
}
finally {
    $null = Disconnect-MgGraph
    Write-Host "Command completed."
}
