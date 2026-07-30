import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { isAxiosError } from 'axios';
import DashboardEmptyState from '../components/DashboardEmptyState';
import DashboardKpiCard from '../components/DashboardKpiCard';
import DashboardSectionHeader from '../components/DashboardSectionHeader';
import DashboardWelcomeBanner from '../components/DashboardWelcomeBanner';
import Loading from '../components/Loading';
import { getRoleLabel, ROUTES, ROLES } from '../constants';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { getAdminCategories } from '../services/adminCategoryService';
import { getAdminUsers } from '../services/adminUserService';
import { getDepartments } from '../services/departmentService';
import type { UserListItem } from '../types/user';
import { formatDateTime } from '../utils';

type SummaryCard = {
  label: string;
  value: number;
  to: string;
  icon: string;
};

type ActivityItem = {
  id: string;
  title: string;
  subtitle: string;
  when: string;
};

type PendingItem = {
  id: string;
  title: string;
  subtitle: string;
  to: string;
};

function countByRole(users: UserListItem[], role: string): number {
  return users.filter((user) => user.role === role).length;
}

export default function AdminHomePage() {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [categoryCount, setCategoryCount] = useState(0);
  const [departmentCount, setDepartmentCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [userList, categories, departments] = await Promise.all([
        getAdminUsers(),
        getAdminCategories(),
        getDepartments(),
      ]);
      setUsers(userList);
      setCategoryCount(categories.length);
      setDepartmentCount(departments.length);
    } catch (err) {
      const message =
        isAxiosError(err) && err.response?.status === 403
          ? 'Bu sayfaya erişim yetkiniz yok.'
          : 'Ana ekran verileri yüklenirken bir hata oluştu.';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const summaryCards = useMemo<SummaryCard[]>(() => {
    const inactiveCount = users.filter((item) => !item.isActive).length;
    return [
      {
        label: 'Toplam Kullanıcı',
        value: users.length,
        to: ROUTES.ADMIN_USERS,
        icon: 'group',
      },
      {
        label: 'Akademisyen',
        value: countByRole(users, ROLES.ACADEMICIAN),
        to: ROUTES.ADMIN_USERS,
        icon: 'school',
      },
      {
        label: 'Araştırma Görevlisi',
        value: countByRole(users, ROLES.ASSISTANT),
        to: ROUTES.ADMIN_USERS,
        icon: 'support_agent',
      },
      {
        label: 'Öğrenci',
        value: countByRole(users, ROLES.STUDENT),
        to: ROUTES.ADMIN_USERS,
        icon: 'person',
      },
      {
        label: 'Bölüm',
        value: departmentCount,
        to: ROUTES.ADMIN_USERS,
        icon: 'apartment',
      },
      {
        label: 'Randevu Kategorisi',
        value: categoryCount,
        to: ROUTES.ADMIN_CATEGORIES,
        icon: 'category',
      },
      {
        label: 'Pasif Hesap',
        value: inactiveCount,
        to: ROUTES.ADMIN_USERS,
        icon: 'person_off',
      },
    ];
  }, [users, categoryCount, departmentCount]);

  const recentActivities = useMemo<ActivityItem[]>(() => {
    return [...users]
      .sort(
        (left, right) =>
          new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
      )
      .slice(0, 5)
      .map((item) => ({
        id: `user-${item.userId}`,
        title: `Yeni kullanıcı: ${item.fullName}`,
        subtitle: `${getRoleLabel(item.role)} - ${item.department}`,
        when: formatDateTime(item.createdAt),
      }));
  }, [users]);

  const pendingItems = useMemo<PendingItem[]>(() => {
    const inactiveUsers = users.filter((item) => !item.isActive);
    const items: PendingItem[] = [];

    if (inactiveUsers.length > 0) {
      items.push({
        id: 'inactive-users',
        title: `${inactiveUsers.length} pasif hesap`,
        subtitle: 'Kullanıcı durumlarını gözden geçirin',
        to: ROUTES.ADMIN_USERS,
      });
      inactiveUsers.slice(0, 3).forEach((item) => {
        items.push({
          id: `inactive-${item.userId}`,
          title: item.fullName,
          subtitle: `${getRoleLabel(item.role)} - Pasif`,
          to: ROUTES.ADMIN_USERS,
        });
      });
    }

    if (categoryCount === 0) {
      items.push({
        id: 'missing-categories',
        title: 'Randevu kategorisi tanımlı değil',
        subtitle: 'Kategori yönetimine giderek tanım ekleyin',
        to: ROUTES.ADMIN_CATEGORIES,
      });
    }

    return items.slice(0, 5);
  }, [users, categoryCount]);

  if (!user) {
    return null;
  }

  return (
    <div className="w-full min-w-0 animate-fade-in">
      <DashboardWelcomeBanner
        fullName={user.fullName}
        description="Sistem kullanıcılarını, kategorileri ve ceza kurallarını buradan yönetebilirsiniz."
        stats={[]}
        showStats={false}
      />

      {error ? (
        <section className="mb-6 rounded-xl border border-error/30 bg-error-container/40 p-6">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <p className="font-body-md text-body-md text-on-error-container">{error}</p>
            <button
              type="button"
              className="rounded-lg bg-primary px-4 py-2 font-label-md text-label-md text-on-primary transition-colors hover:bg-primary/90"
              onClick={() => void loadData()}
            >
              Tekrar Dene
            </button>
          </div>
        </section>
      ) : null}

      <section className="mb-6">
        <h2 className="mb-3 px-1 font-label-md text-label-md uppercase tracking-widest text-outline">
          Özet
        </h2>
        {loading ? (
          <div className="flex min-h-28 items-center justify-center rounded-xl border border-outline-variant bg-surface-container-lowest">
            <Loading label="Özet yükleniyor..." />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {summaryCards.map((card) => (
              <DashboardKpiCard
                key={card.label}
                icon={card.icon}
                label={card.label}
                value={card.value}
                onClick={() => navigate(card.to)}
              />
            ))}
          </div>
        )}
      </section>

      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-12">
        <section className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest lg:col-span-7">
          <DashboardSectionHeader
            title="Son Sistem Hareketleri"
            actionLabel="Kullanıcıları Gör"
            actionPath={ROUTES.ADMIN_USERS}
          />
          <div className="px-4 pb-4">
            {loading ? (
              <div className="flex min-h-32 items-center justify-center">
                <Loading label="Hareketler yükleniyor..." />
              </div>
            ) : recentActivities.length === 0 ? (
              <DashboardEmptyState
                icon="history"
                message="Görüntülenecek sistem hareketi bulunmuyor."
              />
            ) : (
              <ul className="divide-y divide-outline-variant">
                {recentActivities.map((item) => (
                  <li key={item.id} className="py-2.5">
                    <p className="truncate font-body-md text-body-md font-semibold text-primary">
                      {item.title}
                    </p>
                    <p className="mt-0.5 truncate font-label-sm text-label-sm text-on-surface-variant">
                      {item.subtitle}
                    </p>
                    <p className="mt-1 font-label-sm text-label-sm text-outline">{item.when}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <section className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest lg:col-span-5">
          <DashboardSectionHeader
            title="Bekleyen Yönetici İşlemleri"
            actionLabel="Yönetime Git"
            actionPath={ROUTES.ADMIN_USERS}
          />
          <div className="px-4 pb-4">
            {loading ? (
              <div className="flex min-h-32 items-center justify-center">
                <Loading label="İşlemler yükleniyor..." />
              </div>
            ) : pendingItems.length === 0 ? (
              <DashboardEmptyState
                icon="task_alt"
                message="Bekleyen yönetici işlemi bulunmuyor."
              />
            ) : (
              <ul className="divide-y divide-outline-variant">
                {pendingItems.map((item) => (
                  <li key={item.id}>
                    <Link
                      to={item.to}
                      className="block py-2.5 no-underline transition-colors hover:text-primary hover:no-underline focus:no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-fixed-dim"
                    >
                      <p className="truncate font-body-md text-body-md font-semibold text-primary">
                        {item.title}
                      </p>
                      <p className="mt-0.5 truncate font-label-sm text-label-sm text-on-surface-variant">
                        {item.subtitle}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
