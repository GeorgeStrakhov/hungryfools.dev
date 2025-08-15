import { db } from "@/db";
import { companies } from "@/db/schema/company";
import { eq } from "drizzle-orm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  adminCreateCompany,
  adminDeleteCompany,
  adminToggleCompanyActive,
  adminUpdateCompany,
} from "./actions";

export default async function AdminCompaniesPage() {
  const pendingRows = await db
    .select()
    .from(companies)
    .where(eq(companies.isActive, false));

  const activeRows = await db
    .select()
    .from(companies)
    .where(eq(companies.isActive, true));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Companies</h1>
          <p className="text-muted-foreground mt-2">Manage company listings</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button>Add Company</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Company</DialogTitle>
            </DialogHeader>
            <form
              className="space-y-3"
              action={async (formData: FormData) => {
                "use server";
                await adminCreateCompany({
                  name: String(formData.get("name") || ""),
                  logoUrl: String(formData.get("logoUrl") || ""),
                  url: String(formData.get("url") || ""),
                  contactEmail: String(formData.get("contactEmail") || ""),
                  oneliner: String(formData.get("oneliner") || ""),
                  description: String(formData.get("description") || ""),
                });
              }}
            >
              <div>
                <label className="mb-1 block text-sm font-medium">Name</label>
                <Input name="name" required />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Logo URL
                  </label>
                  <Input name="logoUrl" placeholder="https://..." />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Website
                  </label>
                  <Input name="url" placeholder="https://example.com" />
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Contact Email
                  </label>
                  <Input name="contactEmail" placeholder="hello@example.com" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Oneliner
                  </label>
                  <Input name="oneliner" placeholder="Short tagline" />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Description
                </label>
                <Textarea name="description" rows={5} />
              </div>
              <div className="flex justify-end">
                <Button type="submit">Create</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {pendingRows.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Pending approval</h2>
          <div className="rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="p-3 text-left font-medium">Name</th>
                  <th className="p-3 text-left font-medium">Status</th>
                  <th className="p-3 text-left font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingRows.map((c) => (
                  <tr key={c.id} className="border-b">
                    <td className="p-3">
                      <div className="font-medium">{c.name}</div>
                      <div className="text-muted-foreground text-xs">
                        /{c.slug}
                      </div>
                    </td>
                    <td className="p-3">
                      <span className="text-yellow-600">Pending</span>
                    </td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-2">
                        <form
                          action={async () => {
                            "use server";
                            await adminToggleCompanyActive(c.id, true);
                          }}
                        >
                          <Button type="submit" variant="outline" size="sm">
                            Approve
                          </Button>
                        </form>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="secondary" size="sm">
                              Edit
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Edit Company</DialogTitle>
                            </DialogHeader>
                            <form
                              className="space-y-3"
                              action={async (formData: FormData) => {
                                "use server";
                                await adminUpdateCompany(c.id, {
                                  name: String(formData.get("name") || c.name),
                                  logoUrl: String(
                                    formData.get("logoUrl") || c.logoUrl || "",
                                  ),
                                  url: String(
                                    formData.get("url") || c.url || "",
                                  ),
                                  contactEmail: String(
                                    formData.get("contactEmail") ||
                                      c.contactEmail ||
                                      "",
                                  ),
                                  oneliner: String(
                                    formData.get("oneliner") ||
                                      c.oneliner ||
                                      "",
                                  ),
                                  description: String(
                                    formData.get("description") ||
                                      c.description ||
                                      "",
                                  ),
                                });
                              }}
                            >
                              <div>
                                <label className="mb-1 block text-sm font-medium">
                                  Name
                                </label>
                                <Input
                                  name="name"
                                  defaultValue={c.name}
                                  required
                                />
                              </div>
                              <div className="grid gap-3 sm:grid-cols-2">
                                <div>
                                  <label className="mb-1 block text-sm font-medium">
                                    Logo URL
                                  </label>
                                  <Input
                                    name="logoUrl"
                                    defaultValue={c.logoUrl || ""}
                                  />
                                </div>
                                <div>
                                  <label className="mb-1 block text-sm font-medium">
                                    Website
                                  </label>
                                  <Input
                                    name="url"
                                    defaultValue={c.url || ""}
                                  />
                                </div>
                              </div>
                              <div className="grid gap-3 sm:grid-cols-2">
                                <div>
                                  <label className="mb-1 block text-sm font-medium">
                                    Contact Email
                                  </label>
                                  <Input
                                    name="contactEmail"
                                    defaultValue={c.contactEmail || ""}
                                  />
                                </div>
                                <div>
                                  <label className="mb-1 block text-sm font-medium">
                                    Oneliner
                                  </label>
                                  <Input
                                    name="oneliner"
                                    defaultValue={c.oneliner || ""}
                                  />
                                </div>
                              </div>
                              <div>
                                <label className="mb-1 block text-sm font-medium">
                                  Description
                                </label>
                                <Textarea
                                  name="description"
                                  defaultValue={c.description || ""}
                                  rows={5}
                                />
                              </div>
                              <div className="flex justify-end">
                                <Button type="submit">Save</Button>
                              </div>
                            </form>
                          </DialogContent>
                        </Dialog>
                        <form
                          action={async () => {
                            "use server";
                            await adminDeleteCompany(c.id);
                          }}
                        >
                          <Button type="submit" variant="destructive" size="sm">
                            Delete
                          </Button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Active companies</h2>
        <div className="rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="p-3 text-left font-medium">Name</th>
                <th className="p-3 text-left font-medium">Status</th>
                <th className="p-3 text-left font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {activeRows.map((c) => (
                <tr key={c.id} className="border-b">
                  <td className="p-3">
                    <div className="font-medium">{c.name}</div>
                    <div className="text-muted-foreground text-xs">
                      /{c.slug}
                    </div>
                  </td>
                  <td className="p-3">
                    <span className="text-green-600">Active</span>
                  </td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-2">
                      <form
                        action={async () => {
                          "use server";
                          await adminToggleCompanyActive(c.id, false);
                        }}
                      >
                        <Button type="submit" variant="outline" size="sm">
                          Deactivate
                        </Button>
                      </form>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="secondary" size="sm">
                            Edit
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Edit Company</DialogTitle>
                          </DialogHeader>
                          <form
                            className="space-y-3"
                            action={async (formData: FormData) => {
                              "use server";
                              await adminUpdateCompany(c.id, {
                                name: String(formData.get("name") || c.name),
                                logoUrl: String(
                                  formData.get("logoUrl") || c.logoUrl || "",
                                ),
                                url: String(formData.get("url") || c.url || ""),
                                contactEmail: String(
                                  formData.get("contactEmail") ||
                                    c.contactEmail ||
                                    "",
                                ),
                                oneliner: String(
                                  formData.get("oneliner") || c.oneliner || "",
                                ),
                                description: String(
                                  formData.get("description") ||
                                    c.description ||
                                    "",
                                ),
                              });
                            }}
                          >
                            <div>
                              <label className="mb-1 block text-sm font-medium">
                                Name
                              </label>
                              <Input
                                name="name"
                                defaultValue={c.name}
                                required
                              />
                            </div>
                            <div className="grid gap-3 sm:grid-cols-2">
                              <div>
                                <label className="mb-1 block text-sm font-medium">
                                  Logo URL
                                </label>
                                <Input
                                  name="logoUrl"
                                  defaultValue={c.logoUrl || ""}
                                />
                              </div>
                              <div>
                                <label className="mb-1 block text-sm font-medium">
                                  Website
                                </label>
                                <Input name="url" defaultValue={c.url || ""} />
                              </div>
                            </div>
                            <div className="grid gap-3 sm:grid-cols-2">
                              <div>
                                <label className="mb-1 block text-sm font-medium">
                                  Contact Email
                                </label>
                                <Input
                                  name="contactEmail"
                                  defaultValue={c.contactEmail || ""}
                                />
                              </div>
                              <div>
                                <label className="mb-1 block text-sm font-medium">
                                  Oneliner
                                </label>
                                <Input
                                  name="oneliner"
                                  defaultValue={c.oneliner || ""}
                                />
                              </div>
                            </div>
                            <div>
                              <label className="mb-1 block text-sm font-medium">
                                Description
                              </label>
                              <Textarea
                                name="description"
                                defaultValue={c.description || ""}
                                rows={5}
                              />
                            </div>
                            <div className="flex justify-end">
                              <Button type="submit">Save</Button>
                            </div>
                          </form>
                        </DialogContent>
                      </Dialog>
                      <form
                        action={async () => {
                          "use server";
                          await adminDeleteCompany(c.id);
                        }}
                      >
                        <Button type="submit" variant="destructive" size="sm">
                          Delete
                        </Button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
              {activeRows.length === 0 && (
                <tr>
                  <td
                    colSpan={3}
                    className="text-muted-foreground p-6 text-center"
                  >
                    No companies found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
